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
import { AiCommitRoomDto } from './dto/ai-commit-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PresenceService } from '../presence/presence.service';
import { NotificationsService } from '../notifications/notifications.service';

// 6 символов из A-Z и 0-9. Без I/O/0/1, чтобы не путать визуально.
const generateInviteCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: PresenceService,
    private readonly notifications: NotificationsService,
  ) {}

  async createRoom(userId: string, dto: CreateRoomDto) {
    this.validateDates(dto.startsAt, dto.endsAt);

    const inviteCode = generateInviteCode();

    const room = await this.prisma.room.create({
      data: {
        name: dto.name,
        description: dto.description,
        ownerId: userId,
        inviteCode,
        isPublic: dto.isPublic ?? false,
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

  async commitRoomDraft(userId: string, dto: AiCommitRoomDto) {
    const inviteCode = generateInviteCode();

    return this.prisma.$transaction(async (tx) => {
      // 1. Створити кімнату
      const room = await tx.room.create({
        data: {
          name: dto.name,
          description: dto.description ?? null,
          coverUrl: null,
          inviteCode,
          ownerId: userId,
          startsAt: dto.eventDate ? new Date(dto.eventDate) : null,
          members: { create: { userId, role: 'admin' } },
        },
        include: { _count: { select: { members: true } } },
      });

      // 2. Створити опитування
      for (const poll of dto.polls) {
        if (poll.kind === 'single_choice') {
          const options = (poll.options ?? []).filter(Boolean);
          if (options.length < 2) continue;
          await tx.poll.create({
            data: {
              roomId: room.id,
              authorId: userId,
              title: poll.question,
              type: 'single_choice',
              options: {
                create: options.map((label) => ({ label })),
              },
            },
          });
        } else if (poll.kind === 'multi_choice') {
          const options = (poll.options ?? []).filter(Boolean);
          if (options.length < 2) continue;
          await tx.poll.create({
            data: {
              roomId: room.id,
              authorId: userId,
              title: poll.question,
              type: 'multi_choice',
              options: {
                create: options.map((label) => ({ label })),
              },
            },
          });
        } else if (poll.kind === 'location') {
          const places = poll.resolvedPlaces ?? [];
          if (places.length < 2) continue;
          await tx.poll.create({
            data: {
              roomId: room.id,
              authorId: userId,
              title: poll.question,
              type: 'location',
              options: {
                create: places.map((p) => ({
                  label: p.label,
                  latitude: p.latitude,
                  longitude: p.longitude,
                  address: p.address ?? null,
                })),
              },
            },
          });
        }
      }

      return this.serializeRoom(room);
    });
  }

  async listMyRooms(userId: string) {
    const rooms = await this.prisma.room.findMany({
      where: {
        archivedAt: null,
        members: { some: { userId } },
      },
      select: {
        id: true, name: true, description: true, coverUrl: true,
        inviteCode: true, startsAt: true, endsAt: true, ownerId: true,
        createdAt: true, updatedAt: true, status: true, isPublic: true,
        _count: { select: { members: true } },
        members: {
          where: { role: 'admin' },
          take: 1,
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return rooms.map((r) => this.serializeRoom(r));
  }

  async listPublicRooms(viewerId: string) {
    const rooms = await this.prisma.room.findMany({
      where: {
        archivedAt: null,
        isPublic: true,
        status: 'active',
      },
      select: {
        id: true, name: true, description: true, coverUrl: true,
        startsAt: true, endsAt: true, ownerId: true,
        createdAt: true, updatedAt: true, status: true, isPublic: true,
        _count: { select: { members: true } },
        members: {
          where: { role: 'admin' },
          take: 1,
          include: {
            user: { select: { id: true, fullName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { lastActivityAt: 'desc' },
      take: 100,
    });

    const myMemberships = await this.prisma.roomMember.findMany({
      where: { userId: viewerId, roomId: { in: rooms.map((r) => r.id) } },
      select: { roomId: true },
    });
    const memberSet = new Set(myMemberships.map((m) => m.roomId));

    return rooms.map((r) => ({
      // public listing — without inviteCode, leaving fields needed for cards
      id: r.id,
      name: r.name,
      description: r.description,
      coverUrl: r.coverUrl,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      ownerId: r.ownerId,
      memberCount: r._count.members,
      isPublic: r.isPublic,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      admin: r.members[0]?.user ?? null,
      status: r.status,
      isMember: memberSet.has(r.id),
    }));
  }

  async getRoom(userId: string, roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                lastSeenAt: true,
              },
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
        user: {
          ...m.user,
          isOnline: this.presence.isOnline(m.user.id),
        },
      })),
    };
  }

  async joinPublic(userId: string, roomId: string) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.archivedAt) throw new NotFoundException('Room not found');
    if (!room.isPublic) throw new ForbiddenException('Room is not public');

    const existing = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId } },
    });
    if (existing) throw new ConflictException('You are already a member of this room');

    await this.prisma.roomMember.create({
      data: { roomId: room.id, userId, role: 'member' },
    });
    await this.touchActivity(room.id);
    return this.getRoom(userId, room.id);
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

    await this.touchActivity(room.id);

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
        isPublic: dto.isPublic,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      include: { _count: { select: { members: true } } },
    });

    return this.serializeRoom(room);
  }

  async updateCover(userId: string, roomId: string, coverUrl: string) {
    await this.assertAdmin(userId, roomId);
    await this.prisma.room.update({
      where: { id: roomId },
      data: { coverUrl },
    });
    return { coverUrl };
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
    isPublic?: boolean;
    _count: { members: number };
    members?: { user: { id: string; fullName: string; avatarUrl: string | null } }[];
    status?: string;
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
      isPublic: room.isPublic ?? false,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      admin: room.members?.[0]?.user ?? null,
      status: room.status ?? 'open',
    };
  }

  async touchActivity(roomId: string) {
    await this.prisma.room.updateMany({
      where: { id: roomId, status: 'active' },
      data: { lastActivityAt: new Date() },
    });
  }

  // ====== Видалення учасника (адмін) ======
  async removeMember(adminId: string, roomId: string, memberId: string) {
    await this.assertAdmin(adminId, roomId);

    const member = await this.prisma.roomMember.findUnique({
      where: { id: memberId },
      include: { user: { select: { id: true, fullName: true } } },
    });
    if (!member || member.roomId !== roomId) {
      throw new NotFoundException('Member not found');
    }
    if (member.userId === adminId) {
      throw new BadRequestException('Use leave endpoint to exit room yourself');
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, name: true },
    });

    await this.prisma.$transaction([
      this.prisma.roomMember.delete({ where: { id: memberId } }),
      this.prisma.message.create({
        data: {
          roomId,
          type: 'system',
          content: `${member.user.fullName} було видалено з кімнати`,
        },
      }),
    ]);

    // Сповіщення видаленому
    await this.notifications.create(member.userId, 'member_removed', {
      roomId,
      roomName: room?.name ?? 'Кімната',
    });

    return { ok: true };
  }

  // ====== Самовихід ======
  async leaveRoom(userId: string, roomId: string) {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
      include: { user: { select: { id: true, fullName: true } } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this room');

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { _count: { select: { members: true } } },
    });
    if (!room) throw new NotFoundException('Room not found');

    const otherAdmins = await this.prisma.roomMember.count({
      where: { roomId, role: 'admin', NOT: { userId } },
    });
    const totalMembers = room._count.members;
    const isLastAdmin = member.role === 'admin' && otherAdmins === 0;

    // Якщо я останній адмін і в кімнаті ще є інші учасники → треба передати права
    if (isLastAdmin && totalMembers > 1) {
      throw new BadRequestException({
        reason: 'transfer_admin_required',
        message: 'Передайте права адміна іншому учаснику, перш ніж вийти',
      });
    }

    // Якщо я останній учасник взагалі — кімната видаляється
    if (totalMembers === 1) {
      await this.prisma.room.delete({ where: { id: roomId } });
      return { ok: true, deleted: true };
    }

    // Звичайний вихід
    await this.prisma.$transaction([
      this.prisma.roomMember.delete({ where: { id: member.id } }),
      this.prisma.message.create({
        data: {
          roomId,
          type: 'system',
          content: `${member.user.fullName} залишив(-ла) кімнату`,
        },
      }),
    ]);

    return { ok: true, deleted: false };
  }

  // ====== Передача прав адміна ======
  async transferAdmin(adminId: string, roomId: string, newAdminMemberId: string) {
    await this.assertAdmin(adminId, roomId);

    const newAdmin = await this.prisma.roomMember.findUnique({
      where: { id: newAdminMemberId },
      include: { user: { select: { id: true, fullName: true } } },
    });
    if (!newAdmin || newAdmin.roomId !== roomId) {
      throw new NotFoundException('Member not found');
    }
    if (newAdmin.role === 'admin') {
      throw new BadRequestException('User is already admin');
    }

    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { name: true },
    });

    await this.prisma.$transaction([
      this.prisma.roomMember.update({
        where: { id: newAdmin.id },
        data: { role: 'admin' },
      }),
      this.prisma.message.create({
        data: {
          roomId,
          type: 'system',
          content: `${newAdmin.user.fullName} тепер адміністратор`,
        },
      }),
    ]);

    await this.notifications.create(newAdmin.userId, 'room_admin_transferred', {
      roomId,
      roomName: room?.name ?? 'Кімната',
    });

    return { ok: true };
  }
}
