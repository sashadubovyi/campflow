import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationKind } from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(userId: string, kind: NotificationKind, payload: Record<string, unknown>) {
    const notification = await this.prisma.notification.create({
      data: { userId, kind, payload: payload as Prisma.InputJsonValue },
    });
    // Real-time доставка одержувачу
    this.gateway.emitToUser(userId, 'notification:new', notification);
    return notification;
  }

  async list(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Для invite-сповіщень підтягуємо актуальний статус
    const inviteIds = notifications
      .filter((n) => n.kind === 'room_invite' && n.payload && typeof n.payload === 'object')
      .map((n) => (n.payload as Record<string, unknown>).inviteId)
      .filter((id): id is string => typeof id === 'string');

    if (inviteIds.length === 0) return notifications;

    const invites = await this.prisma.roomInvite.findMany({
      where: { id: { in: inviteIds } },
      select: { id: true, status: true },
    });
    const statusMap = new Map(invites.map((i) => [i.id, i.status]));

    return notifications.map((n) => {
      if (n.kind === 'room_invite' && n.payload && typeof n.payload === 'object') {
        const inviteId = (n.payload as Record<string, unknown>).inviteId;
        if (typeof inviteId === 'string') {
          return {
            ...n,
            payload: {
              ...(n.payload as Record<string, unknown>),
              currentStatus: statusMap.get(inviteId) ?? null,
            },
          };
        }
      }
      return n;
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markRead(userId: string, notificationId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true };
  }
}
