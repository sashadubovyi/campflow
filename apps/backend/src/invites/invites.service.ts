import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContactsService } from '../contacts/contacts.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contacts: ContactsService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Перевірка можливості запросити юзера. Викликається з фронту перед показом кнопки —
   * щоб одразу повертати причину якщо запросити неможливо.
   */
  async canInvite(actorId: string, targetUsername: string, roomId: string) {
    const target = await this.prisma.user.findUnique({
      where: { username: targetUsername.toLowerCase() },
      select: { id: true, username: true, fullName: true, avatarUrl: true, inviteFrom: true },
    });
    if (!target) return { allowed: false, reason: 'not_found' as const };

    // Сам себе не можна
    if (target.id === actorId) return { allowed: false, reason: 'self' as const };

    // Уже учасник
    const existingMember = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: target.id } },
    });
    if (existingMember) return { allowed: false, reason: 'already_member' as const, target };

    // Уже є pending-інвайт
    const existingInvite = await this.prisma.roomInvite.findFirst({
      where: { roomId, invitedUserId: target.id, status: 'pending' },
    });
    if (existingInvite) return { allowed: false, reason: 'already_invited' as const, target };

    // Політика приватності одержувача
    if (target.inviteFrom === 'none') {
      return { allowed: false, reason: 'blocked_by_policy' as const, target };
    }
    if (target.inviteFrom === 'contacts') {
      const inHisContacts = await this.contacts.isContact(target.id, actorId);
      if (!inHisContacts) {
        return { allowed: false, reason: 'blocked_by_policy' as const, target };
      }
    }

    return { allowed: true as const, target };
  }

  async createInvite(actorId: string, targetUsername: string, roomId: string, message?: string) {
    // Перевіряємо членство відправника
    const actorMember = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId: actorId } },
    });
    if (!actorMember) throw new ForbiddenException('You are not a member of this room');

    const check = await this.canInvite(actorId, targetUsername, roomId);
    if (!check.allowed) {
      // Перетворюємо причину на дружню помилку
      const reasonMap: Record<string, string> = {
        not_found: 'Користувача не знайдено',
        self: 'Не можна запросити самого себе',
        already_member: 'Користувач вже в кімнаті',
        already_invited: 'Запрошення вже надіслано',
        blocked_by_policy: 'Користувач заборонив надсилати йому запрошення',
      };
      throw new BadRequestException({
        reason: check.reason,
        message: reasonMap[check.reason] ?? 'Неможливо запросити',
      });
    }

    // Створюємо інвайт + сповіщення одним атомарним блоком
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, name: true },
    });
    if (!room) throw new NotFoundException('Room not found');

    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { id: true, username: true, fullName: true, avatarUrl: true },
    });

    const invite = await this.prisma.roomInvite.create({
      data: {
        roomId,
        invitedById: actorId,
        invitedUserId: check.target!.id,
        message: message?.trim() || null,
      },
    });

    // Запускаємо сповіщення одержувачу (з real-time доставкою через WS)
    await this.notifications.create(check.target!.id, 'room_invite', {
      inviteId: invite.id,
      roomId: room.id,
      roomName: room.name,
      invitedBy: actor,
      message: message?.trim() || null,
    });

    return invite;
  }

  /**
   * Перелік pending-запрошень користувача (для UI «Мене запрошують»).
   */
  async myPending(userId: string) {
    return this.prisma.roomInvite.findMany({
      where: { invitedUserId: userId, status: 'pending' },
      include: {
        room: { select: { id: true, name: true, eventDate: true, startsAt: true, endsAt: true } },
        invitedBy: {
          select: { id: true, username: true, fullName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async accept(userId: string, inviteId: string) {
    const invite = await this.prisma.roomInvite.findUnique({
      where: { id: inviteId },
      include: { room: { select: { id: true, name: true } } },
    });
    if (!invite || invite.invitedUserId !== userId) {
      throw new NotFoundException('Invite not found');
    }
    if (invite.status !== 'pending' && invite.status !== 'deferred') {
      throw new BadRequestException('Invite already resolved');
    }

    // Додаємо в кімнату (якщо ще не там — на випадок гонитви)
    const exists = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId: invite.roomId, userId } },
    });
    if (!exists) {
      await this.prisma.roomMember.create({
        data: { roomId: invite.roomId, userId, role: 'member' },
      });
    }

    await this.prisma.roomInvite.update({
      where: { id: invite.id },
      data: { status: 'accepted', respondedAt: new Date() },
    });

    // Сповіщення запрошувачу
    await this.notifications.create(invite.invitedById, 'room_invite_accepted', {
      inviteId: invite.id,
      roomId: invite.room.id,
      roomName: invite.room.name,
      accepterId: userId,
    });

    return { ok: true, roomId: invite.roomId };
  }

  async decline(userId: string, inviteId: string) {
    const invite = await this.prisma.roomInvite.findUnique({
      where: { id: inviteId },
      include: { room: { select: { id: true, name: true } } },
    });
    if (!invite || invite.invitedUserId !== userId) {
      throw new NotFoundException('Invite not found');
    }
    if (invite.status !== 'pending' && invite.status !== 'deferred') {
      throw new BadRequestException('Invite already resolved');
    }

    await this.prisma.roomInvite.update({
      where: { id: invite.id },
      data: { status: 'declined', respondedAt: new Date() },
    });

    // М'яка нотифікація запрошувачу ("Не прийнято" — без причини)
    await this.notifications.create(invite.invitedById, 'room_invite_declined', {
      inviteId: invite.id,
      roomId: invite.room.id,
      roomName: invite.room.name,
    });

    return { ok: true };
  }

  async defer(userId: string, inviteId: string) {
    const invite = await this.prisma.roomInvite.findUnique({
      where: { id: inviteId },
    });
    if (!invite || invite.invitedUserId !== userId) {
      throw new NotFoundException('Invite not found');
    }
    if (invite.status !== 'pending') {
      throw new BadRequestException('Invite already resolved');
    }
    await this.prisma.roomInvite.update({
      where: { id: invite.id },
      data: { status: 'deferred' },
    });
    return { ok: true };
  }
}
