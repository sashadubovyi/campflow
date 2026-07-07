import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { Prisma } from '@prisma/client';
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
              // AI-чекліст ("хто що бере") — одразу з розподілом по учасниках
              allowAssign: true,
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
    // Стрічка фільтрується: own + контакти + ті, чий власник у тому самому місті.
    // Якщо у viewer не задано city — третя умова просто не спрацьовує.
    const viewer = await this.prisma.user.findUnique({
      where: { id: viewerId },
      select: { city: true },
    });
    const sameCity =
      viewer?.city && viewer.city.trim().length > 0
        ? [{ owner: { city: viewer.city } }]
        : [];

    const rooms = await this.prisma.room.findMany({
      where: {
        archivedAt: null,
        isPublic: true,
        status: 'active',
        OR: [
          { ownerId: viewerId },
          { owner: { contactsOf: { some: { ownerId: viewerId } } } },
          ...sameCity,
        ],
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

  // Запит на приєднання до публічної кімнати — створюємо сповіщення усім адмінам.
  async requestJoin(userId: string, roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: { where: { role: 'admin' }, select: { userId: true } },
      },
    });
    if (!room || room.archivedAt) throw new NotFoundException('Room not found');
    if (!room.isPublic) throw new ForbiddenException('Room is not public');

    const existing = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: room.id, userId } },
    });
    if (existing) throw new ConflictException('You are already a member of this room');

    // Запобігаємо дублюванню активних запитів (один pending запит на кімнату)
    const recent = await this.prisma.notification.findFirst({
      where: {
        kind: 'join_request',
        userId: { in: room.members.map((m) => m.userId) },
        payload: { path: ['requesterId'], equals: userId },
        AND: [{ payload: { path: ['roomId'], equals: room.id } }],
        readAt: null,
      },
    });
    if (recent) throw new ConflictException('Join request is already pending');

    const requester = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, username: true, fullName: true, avatarUrl: true },
    });

    // Один notification на кожного адміна
    for (const admin of room.members) {
      await this.notifications.create(admin.userId, 'join_request', {
        roomId: room.id,
        roomName: room.name,
        requester,
      });
    }

    return { ok: true };
  }

  async acceptJoinRequest(adminId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== adminId) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.kind !== 'join_request') {
      throw new BadRequestException('Notification is not a join request');
    }

    const payload = notification.payload as {
      roomId?: string;
      roomName?: string;
      requester?: { id: string; fullName: string };
    };
    const { roomId, requester } = payload;
    if (!roomId || !requester?.id) {
      throw new BadRequestException('Malformed payload');
    }

    await this.assertAdmin(adminId, roomId);

    const existing = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: requester.id } },
    });
    if (!existing) {
      await this.prisma.roomMember.create({
        data: { roomId, userId: requester.id, role: 'member' },
      });
      await this.touchActivity(roomId);
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        readAt: new Date(),
        payload: {
          ...(notification.payload as Record<string, unknown>),
          currentStatus: 'accepted',
        } as Prisma.InputJsonValue,
      },
    });

    // Сповістити заявника, що його прийняли
    await this.notifications.create(requester.id, 'join_request_accepted', {
      roomId,
      roomName: payload.roomName ?? '',
    });

    return { ok: true };
  }

  async rejectJoinRequest(adminId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification || notification.userId !== adminId) {
      throw new NotFoundException('Notification not found');
    }
    if (notification.kind !== 'join_request') {
      throw new BadRequestException('Notification is not a join request');
    }

    const payload = notification.payload as {
      roomId?: string;
      roomName?: string;
      requester?: { id: string };
    };
    const { roomId, requester } = payload;
    if (!roomId || !requester?.id) {
      throw new BadRequestException('Malformed payload');
    }

    await this.assertAdmin(adminId, roomId);

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        readAt: new Date(),
        payload: {
          ...(notification.payload as Record<string, unknown>),
          currentStatus: 'rejected',
        } as Prisma.InputJsonValue,
      },
    });

    await this.notifications.create(requester.id, 'join_request_rejected', {
      roomId,
      roomName: payload.roomName ?? '',
    });

    return { ok: true };
  }

  async joinByCode(userId: string, inviteCode: string) {
    const room = await this.prisma.room.findUnique({
      where: { inviteCode },
    });

    if (!room || room.archivedAt) {
      throw new NotFoundException('Invite code is invalid');
    }

    // Атомарно через unique constraint (roomId, userId): конкурентний
    // подвійний join дає P2002 → 409, а не 500 з check-then-create гонки.
    try {
      await this.prisma.roomMember.create({
        data: { roomId: room.id, userId, role: 'member' },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('You are already a member of this room');
      }
      throw err;
    }

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
    // Нова активність скидає deletionWarnedAt — інакше кімната, що ожила
    // після попередження, при наступному простої видаляється БЕЗ другого
    // попередження (warn-вибірка фільтрує deletionWarnedAt: null).
    await this.prisma.room.updateMany({
      where: { id: roomId, status: 'active' },
      data: { lastActivityAt: new Date(), deletionWarnedAt: null },
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
    // Serializable-транзакція: рахунок адмінів/учасників і видалення мають
    // бути атомарними, інакше два останні адміни, що виходять одночасно,
    // обидва бачать "є ще один адмін" — і кімната лишається без адміна.
    // При serialization-конфлікті (P2034) Postgres відхиляє одну з
    // транзакцій — повторюємо її кілька разів.
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const member = await tx.roomMember.findUnique({
              where: { roomId_userId: { roomId, userId } },
              include: { user: { select: { id: true, fullName: true } } },
            });
            if (!member) throw new ForbiddenException('You are not a member of this room');

            const totalMembers = await tx.roomMember.count({ where: { roomId } });
            const otherAdmins = await tx.roomMember.count({
              where: { roomId, role: 'admin', NOT: { userId } },
            });
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
              await tx.room.delete({ where: { id: roomId } });
              return { ok: true, deleted: true };
            }

            // Звичайний вихід
            await tx.roomMember.delete({ where: { id: member.id } });
            await tx.message.create({
              data: {
                roomId,
                type: 'system',
                content: `${member.user.fullName} залишив(-ла) кімнату`,
              },
            });

            return { ok: true, deleted: false };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (err) {
        const isSerializationConflict =
          err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034';
        if (!isSerializationConflict || attempt >= 3) throw err;
      }
    }
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
