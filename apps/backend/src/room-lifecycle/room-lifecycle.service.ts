import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const WARN_BEFORE_DAYS = 2;
const INACTIVITY_DAYS = 15;
const EVENT_GRACE_DAYS = 2;
const BATCH_SIZE = 100;

@Injectable()
export class RoomLifecycleService {
  private readonly logger = new Logger(RoomLifecycleService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleLifecycle() {
    this.logger.log('Room lifecycle cron started');
    await this.warnSoonToBeDeleted();
    await this.deleteExpiredRooms();
    this.logger.log('Room lifecycle cron finished');
  }

  private deletionDate(room: { eventDate: Date | null; lastActivityAt: Date }): Date {
    if (room.eventDate) {
      const d = new Date(room.eventDate);
      d.setDate(d.getDate() + EVENT_GRACE_DAYS);
      return d;
    }
    const d = new Date(room.lastActivityAt);
    d.setDate(d.getDate() + INACTIVITY_DAYS);
    return d;
  }

  private async warnSoonToBeDeleted() {
    const now = new Date();
    const warnThreshold = new Date();
    warnThreshold.setDate(warnThreshold.getDate() + WARN_BEFORE_DAYS);

    const rooms = await this.prisma.room.findMany({
      where: { status: 'active', deletionWarnedAt: null },
      select: { id: true, eventDate: true, lastActivityAt: true },
      take: 1000,
    });

    let warned = 0;
    for (const room of rooms) {
      const delDate = this.deletionDate(room);
      if (delDate <= warnThreshold && delDate > now) {
        await this.prisma.$transaction([
          this.prisma.message.create({
            data: {
              roomId: room.id,
              type: 'system',
              content:
                'Кімнату буде автоматично видалено через 2 дні. Поверніть активність, щоб продовжити її життя.',
            },
          }),
          this.prisma.room.update({
            where: { id: room.id },
            data: { deletionWarnedAt: now },
          }),
        ]);
        warned++;
      }
    }
    if (warned > 0) this.logger.log(`Warned ${warned} room(s)`);
  }

  private async deleteExpiredRooms() {
    const now = new Date();
    let totalDeleted = 0;

    const candidates = await this.prisma.room.findMany({
      where: { status: 'active' },
      select: { id: true, name: true, eventDate: true, lastActivityAt: true },
      take: BATCH_SIZE,
    });

    for (const room of candidates) {
      const delDate = this.deletionDate(room);
      if (delDate > now) continue;
      await this.archiveAndDelete(room.id, room.name, room.eventDate);
      totalDeleted++;
    }

    if (totalDeleted > 0) this.logger.log(`Deleted ${totalDeleted} room(s)`);
  }

  async archiveAndDelete(roomId: string, roomName: string, eventDate: Date | null) {
    const members = await this.prisma.roomMember.findMany({
      where: { roomId },
      include: { user: { select: { id: true, fullName: true } } },
    });

    const participants = members.map((m) => m.user.fullName);
    const summary = `Подія "${roomName}" завершена. Учасників: ${participants.length}.`;

    await this.prisma.$transaction(async (tx) => {
      for (const m of members) {
        await tx.eventMemory.create({
          data: { userId: m.userId, roomName, eventDate, participants, summary },
        });
      }
      await tx.room.delete({ where: { id: roomId } });
    });

    this.logger.log(`Room ${roomId} archived and deleted`);
  }

  private async assertAdmin(userId: string, roomId: string) {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this room');
    if (member.role !== 'admin') throw new ForbiddenException('Admin role required');
  }

  async closeRoom(userId: string, roomId: string) {
    await this.assertAdmin(userId, roomId);

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: { include: { user: { select: { id: true, fullName: true } } } },
      },
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.status === 'closed') throw new BadRequestException('Room is already closed');

    const participants = room.members.map((m) => m.user.fullName);
    const summary = `Подія "${room.name}" завершена. Учасників: ${participants.length}.`;

    await this.prisma.$transaction(async (tx) => {
      for (const m of room.members) {
        await tx.eventMemory.create({
          data: {
            userId: m.userId,
            roomName: room.name,
            eventDate: room.eventDate,
            participants,
            summary,
          },
        });
      }
      await tx.message.deleteMany({ where: { roomId } });
      await tx.message.create({
        data: {
          roomId,
          type: 'system',
          content: 'Кімнату закрито адміністратором. Фінальний план збережено.',
        },
      });
      await tx.room.update({
        where: { id: roomId },
        data: { status: 'closed', closedAt: new Date() },
      });
    });

    this.logger.log(`Room ${roomId} closed by ${userId}`);
    return { status: 'closed', summary, participants };
  }

  async runLifecycleNow() {
    await this.warnSoonToBeDeleted();
    await this.deleteExpiredRooms();
    return { ok: true, ranAt: new Date().toISOString() };
  }
}
