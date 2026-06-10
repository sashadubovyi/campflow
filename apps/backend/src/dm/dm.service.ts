import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BlocksService } from '../blocks/blocks.service';
import { PresenceService } from '../presence/presence.service';

@Injectable()
export class DmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly blocks: BlocksService,
    private readonly presence: PresenceService,
  ) {}

  /** Канонічна пара (userAId < userBId) — для @@unique та get-or-create. */
  private orderPair(userIdX: string, userIdY: string): [string, string] {
    return userIdX < userIdY ? [userIdX, userIdY] : [userIdY, userIdX];
  }

  async listMyChats(userId: string) {
    const chats = await this.prisma.directChat.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        userA: { select: { id: true, username: true, fullName: true, avatarUrl: true, lastSeenAt: true } },
        userB: { select: { id: true, username: true, fullName: true, avatarUrl: true, lastSeenAt: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { id: true, content: true, createdAt: true, authorId: true },
        },
      },
      take: 100,
    });

    return chats.map((c) => {
      const peer = c.userAId === userId ? c.userB : c.userA;
      const last = c.messages[0] ?? null;
      return {
        id: c.id,
        peer: {
          ...peer,
          isOnline: this.presence.isOnline(peer.id),
        },
        lastMessage: last
          ? {
              id: last.id,
              content: last.content,
              createdAt: last.createdAt,
              isOwn: last.authorId === userId,
            }
          : null,
        lastMessageAt: c.lastMessageAt,
      };
    });
  }

  /** Знайти або створити чат поточного юзера з кимось за username. */
  async getOrCreateChatWith(currentUserId: string, peerUsername: string) {
    const peer = await this.prisma.user.findUnique({
      where: { username: peerUsername.toLowerCase() },
      select: { id: true, username: true, fullName: true, avatarUrl: true, lastSeenAt: true },
    });
    if (!peer) throw new NotFoundException('User not found');
    if (peer.id === currentUserId) {
      throw new BadRequestException('Cannot DM yourself');
    }

    const blocked = await this.blocks.isBlockedEitherWay(currentUserId, peer.id);
    if (blocked) throw new ForbiddenException('Cannot DM this user');

    const [userAId, userBId] = this.orderPair(currentUserId, peer.id);

    const chat = await this.prisma.directChat.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      update: {},
      create: { userAId, userBId },
    });

    return {
      id: chat.id,
      peer: { ...peer, isOnline: this.presence.isOnline(peer.id) },
      lastMessageAt: chat.lastMessageAt,
    };
  }

  /** Перевірка членства в чаті + отримання peer'а. */
  private async assertMember(userId: string, chatId: string) {
    const chat = await this.prisma.directChat.findUnique({
      where: { id: chatId },
      include: {
        userA: { select: { id: true, username: true, fullName: true, avatarUrl: true, lastSeenAt: true } },
        userB: { select: { id: true, username: true, fullName: true, avatarUrl: true, lastSeenAt: true } },
      },
    });
    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.userAId !== userId && chat.userBId !== userId) {
      throw new ForbiddenException('Not a participant of this chat');
    }
    const peer = chat.userAId === userId ? chat.userB : chat.userA;
    return { chat, peer };
  }

  async getChat(userId: string, chatId: string) {
    const { chat, peer } = await this.assertMember(userId, chatId);
    return {
      id: chat.id,
      peer: { ...peer, isOnline: this.presence.isOnline(peer.id) },
      lastMessageAt: chat.lastMessageAt,
    };
  }

  async getMessages(userId: string, chatId: string) {
    await this.assertMember(userId, chatId);
    const messages = await this.prisma.directMessage.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: { id: true, content: true, createdAt: true, authorId: true },
    });
    return messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      isOwn: m.authorId === userId,
    }));
  }

  async deleteChat(userId: string, chatId: string) {
    await this.assertMember(userId, chatId);
    await this.prisma.directMessage.deleteMany({ where: { chatId } });
    await this.prisma.directChat.delete({ where: { id: chatId } });
  }

  async sendMessage(userId: string, chatId: string, content: string) {
    const trimmed = content.trim();
    if (!trimmed) throw new BadRequestException('Empty message');
    if (trimmed.length > 4000) throw new BadRequestException('Message too long');

    const { peer } = await this.assertMember(userId, chatId);
    const blocked = await this.blocks.isBlockedEitherWay(userId, peer.id);
    if (blocked) throw new ForbiddenException('Cannot DM this user');

    const message = await this.prisma.directMessage.create({
      data: { chatId, authorId: userId, content: trimmed },
      select: { id: true, content: true, createdAt: true, authorId: true },
    });
    await this.prisma.directChat.update({
      where: { id: chatId },
      data: { lastMessageAt: message.createdAt },
    });
    return {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      isOwn: true,
    };
  }
}
