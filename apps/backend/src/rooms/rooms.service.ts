import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

// 6 символов из A-Z и 0-9. Без I/O/0/1, чтобы не путать визуально.
const generateInviteCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(userId: string, dto: CreateRoomDto) {
    this.validateDates(dto.startsAt, dto.endsAt);

    const inviteCode = generateInviteCode();

    const room = await this.prisma.room.create({
      data: {
        name: dto.name,
        description: dto.description,
        ownerId: userId,
        inviteCode,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        members: {
          create: {
            userId,
            role: 'admin',
          },
        },
      },
      include: {
        _count: { select: { members: true } },
      },
    });

    return this.serializeRoom(room);
  }

  async listMyRooms(userId: string) {
    const rooms = await this.prisma.room.findMany({
      where: {
        archivedAt: null,
        members: { some: { userId } },
      },
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rooms.map((r) => this.serializeRoom(r));
  }

  async getRoom(userId: string, roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true, avatarUrl: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { members: true } },
      },
    });

    if (!room) throw new NotFoundException('Room not found');

    const membership = room.members.find((m) => m.userId === userId);
    if (!membership) throw new ForbiddenException('You are not a member of this room');

    return {
      ...this.serializeRoom(room),
      currentUserRole: membership.role,
      members: room.members.map((m) => ({
        id: m.id,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
    };
  }

  async joinByCode(userId: string, inviteCode: string) {
    const room = await this.prisma.room.findUnique({
      where: { inviteCode },
    });

    if (!room || room.archivedAt) {
      throw new NotFoundException('Invite code is invalid');
    }

    const existing = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId } },
    });

    if (existing) {
      throw new ConflictException('You are already a member of this room');
    }

    await this.prisma.roomMember.create({
      data: { roomId: room.id, userId, role: 'member' },
    });

    return this.getRoom(userId, room.id);
  }

  async updateRoom(userId: string, roomId: string, dto: UpdateRoomDto) {
    await this.assertAdmin(userId, roomId);
    this.validateDates(dto.startsAt, dto.endsAt);

    const room = await this.prisma.room.update({
      where: { id: roomId },
      data: {
        name: dto.name,
        description: dto.description,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      include: { _count: { select: { members: true } } },
    });

    return this.serializeRoom(room);
  }

  async regenerateInvite(userId: string, roomId: string) {
    await this.assertAdmin(userId, roomId);
    const inviteCode = generateInviteCode();
    const room = await this.prisma.room.update({
      where: { id: roomId },
      data: { inviteCode },
    });
    return { inviteCode: room.inviteCode };
  }

  async archiveRoom(userId: string, roomId: string) {
    await this.assertAdmin(userId, roomId);
    await this.prisma.room.update({
      where: { id: roomId },
      data: { archivedAt: new Date() },
    });
  }

  private async assertAdmin(userId: string, roomId: string) {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this room');
    if (member.role !== 'admin') throw new ForbiddenException('Admin role required');
  }

  private validateDates(startsAt?: string, endsAt?: string) {
    if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
      throw new BadRequestException('startsAt must be before endsAt');
    }
  }

  private serializeRoom(room: {
    id: string;
    name: string;
    description: string | null;
    coverUrl: string | null;
    inviteCode: string;
    startsAt: Date | null;
    endsAt: Date | null;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    _count: { members: number };
  }) {
    return {
      id: room.id,
      name: room.name,
      description: room.description,
      coverUrl: room.coverUrl,
      inviteCode: room.inviteCode,
      startsAt: room.startsAt,
      endsAt: room.endsAt,
      ownerId: room.ownerId,
      memberCount: room._count.members,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }
}
