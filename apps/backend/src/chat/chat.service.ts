import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomsService: RoomsService,
  ) {}

  async assertMembership(userId: string, roomId: string) {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this room');
    return member;
  }

  async createMessage(userId: string, roomId: string, content: string) {
    await this.assertMembership(userId, roomId);

    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || room.archivedAt) throw new NotFoundException('Room not found');

    const message = await this.prisma.message.create({
      data: {
        roomId,
        authorId: userId,
        content,
        type: 'text',
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
    });

    await this.roomsService.touchActivity(roomId);

    return message;
  }

  async listMessages(userId: string, roomId: string, options: { limit?: number; cursor?: string }) {
    await this.assertMembership(userId, roomId);

    const limit = options.limit ?? 30;
    const messages = await this.prisma.message.findMany({
      where: {
        roomId,
        ...(options.cursor && { createdAt: { lt: new Date(options.cursor) } }),
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor = hasMore ? items[items.length - 1]!.createdAt.toISOString() : null;

    // Возвращаем в хронологическом порядке (старые → новые) для удобства фронта
    return {
      items: items.reverse(),
      nextCursor,
      hasMore,
    };
  }

  async touchLastSeen(userId: string, roomId: string) {
    await this.prisma.roomMember.updateMany({
      where: { roomId, userId },
      data: { lastSeenAt: new Date() },
    });
  }
}
