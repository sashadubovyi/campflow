import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

const WARN_BEFORE_DAYS = 2;
const INACTIVITY_DAYS = 15;
const EVENT_GRACE_DAYS = 2;
const BATCH_SIZE = 100;

@Injectable()
export class RoomLifecycleService {
  private readonly logger = new Logger(RoomLifecycleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

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

  /**
   * Prisma-фільтр «deletionDate(room) <= cutoff» — той самий предикат, що
   * deletionDate(), але виражений у SQL, щоб take-ліміт не відрізав
   * прострочені кімнати, які випадково не потрапили в перші N рядків.
   */
  private expiryFilter(cutoff: Date) {
    const eventCutoff = new Date(cutoff);
    eventCutoff.setDate(eventCutoff.getDate() - EVENT_GRACE_DAYS);
    const activityCutoff = new Date(cutoff);
    activityCutoff.setDate(activityCutoff.getDate() - INACTIVITY_DAYS);
    return {
      OR: [
        { eventDate: { lte: eventCutoff } },
        { eventDate: null, lastActivityAt: { lte: activityCutoff } },
      ],
    };
  }

  private async warnSoonToBeDeleted() {
    const now = new Date();
    const warnThreshold = new Date();
    warnThreshold.setDate(warnThreshold.getDate() + WARN_BEFORE_DAYS);

    const rooms = await this.prisma.room.findMany({
      where: { status: 'active', deletionWarnedAt: null, ...this.expiryFilter(warnThreshold) },
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

    // Батчами до вичерпання: видалені кімнати випадають з наступної вибірки,
    // тому цикл гарантовано завершується.
    for (;;) {
      const candidates = await this.prisma.room.findMany({
        where: { status: 'active', ...this.expiryFilter(now) },
        select: { id: true, name: true, eventDate: true, lastActivityAt: true },
        take: BATCH_SIZE,
      });
      if (candidates.length === 0) break;

      for (const room of candidates) {
        await this.archiveAndDelete(room.id, room.name, room.eventDate);
        totalDeleted++;
      }
      if (candidates.length < BATCH_SIZE) break;
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

    const planItems = await this.prisma.finalPlanItem.findMany({
      where: { roomId },
      select: { title: true },
    });
    const planTitles = planItems.map((p) => p.title);

    const summary = await this.ai.summarizeRoom(room.name, participants, planTitles, 'uk');

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
