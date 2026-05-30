import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BlocksService {
  constructor(private readonly prisma: PrismaService) {}

  /** Чи userA заблокував userB? */
  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    if (blockerId === blockedId) return false;
    const block = await this.prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    return !!block;
  }

  /** Чи між userA та userB є блок у будь-яку сторону? */
  async isBlockedEitherWay(userA: string, userB: string): Promise<boolean> {
    if (userA === userB) return false;
    const block = await this.prisma.userBlock.findFirst({
      where: {
        OR: [
          { blockerId: userA, blockedId: userB },
          { blockerId: userB, blockedId: userA },
        ],
      },
    });
    return !!block;
  }

  async block(blockerId: string, blockedId: string, reason?: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (existing) throw new ConflictException('User already blocked');

    // Транзакція: створити блок + видалити контакти з обох боків
    return this.prisma.$transaction(async (tx) => {
      const block = await tx.userBlock.create({
        data: { blockerId, blockedId, reason: reason?.trim() || null },
      });

      // Видаляємо контакти в обидва боки (якщо були)
      await tx.contact.deleteMany({
        where: {
          OR: [
            { ownerId: blockerId, contactId: blockedId },
            { ownerId: blockedId, contactId: blockerId },
          ],
        },
      });

      // Відхиляємо pending-запрошення з обох боків
      await tx.roomInvite.updateMany({
        where: {
          status: 'pending',
          OR: [
            { invitedById: blockerId, invitedUserId: blockedId },
            { invitedById: blockedId, invitedUserId: blockerId },
          ],
        },
        data: { status: 'cancelled', respondedAt: new Date() },
      });

      return block;
    });
  }

  async unblock(blockerId: string, blockedId: string) {
    const existing = await this.prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (!existing) throw new NotFoundException('Not blocked');

    await this.prisma.userBlock.delete({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    return { unblocked: true };
  }

  async listBlocked(userId: string) {
    const blocks = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return blocks.map((b) => ({
      id: b.id,
      blockedAt: b.createdAt,
      reason: b.reason,
      user: b.blocked,
    }));
  }
}
