import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinalPlanService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertMember(userId: string, roomId: string) {
    const member = await this.prisma.roomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!member) throw new ForbiddenException('You are not a member of this room');
    return member;
  }

  private async assertAdmin(userId: string, roomId: string) {
    const member = await this.assertMember(userId, roomId);
    if (member.role !== 'admin') throw new ForbiddenException('Admin role required');
  }

  private categoryForPollType(type: string): string {
    switch (type) {
      case 'location':
        return 'location';
      case 'multi_choice':
        return 'item';
      default:
        return 'decision';
    }
  }

  async approvePoll(userId: string, pollId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
          orderBy: { position: 'asc' },
        },
      },
    });
    if (!poll) throw new NotFoundException('Poll not found');
    await this.assertAdmin(userId, poll.roomId);

    const category = this.categoryForPollType(poll.type);

    // Визначаємо переможців.
    // single_choice / location -> опція(ї) з максимумом голосів.
    // multi_choice -> усі опції, що мають хоча б 1 голос (чек-лист погоджених речей).
    let winners = poll.options;
    if (poll.type === 'single_choice' || poll.type === 'location') {
      const maxVotes = Math.max(0, ...poll.options.map((o) => o._count.votes));
      winners = poll.options.filter((o) => o._count.votes === maxVotes && maxVotes > 0);
    } else if (poll.type === 'multi_choice') {
      winners = poll.options.filter((o) => o._count.votes > 0);
    }

    await this.prisma.$transaction(async (tx) => {
      // Прибираємо попередні записи цього опитування (на випадок повторного затвердження)
      await tx.finalPlanItem.deleteMany({ where: { pollId } });

      for (const opt of winners) {
        await tx.finalPlanItem.create({
          data: {
            roomId: poll.roomId,
            pollId: poll.id,
            optionId: opt.id,
            title: opt.label,
            category,
            latitude: opt.latitude,
            longitude: opt.longitude,
            address: opt.address,
            assignedTo: opt.assignedTo,
            approvedBy: userId,
            payload: { pollTitle: poll.title, votes: opt._count.votes },
          },
        });
      }

      await tx.poll.update({
        where: { id: poll.id },
        data: { status: 'approved', approvedAt: new Date(), closedAt: new Date() },
      });
    });

    return this.getRoomPlan(userId, poll.roomId);
  }

  async removeFromPlanByPoll(userId: string, pollId: string) {
    const poll = await this.prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll) throw new NotFoundException('Poll not found');
    await this.assertAdmin(userId, poll.roomId);

    await this.prisma.finalPlanItem.deleteMany({ where: { pollId } });
    return this.getRoomPlan(userId, poll.roomId);
  }

  async getRoomPlan(userId: string, roomId: string) {
    await this.assertMember(userId, roomId);

    const items = await this.prisma.finalPlanItem.findMany({
      where: { roomId },
      orderBy: { approvedAt: 'asc' },
    });

    // Підтягнемо інфо про відповідальних (assignedTo) одним запитом
    const assigneeIds = [...new Set(items.map((i) => i.assignedTo).filter(Boolean))] as string[];
    const assignees = assigneeIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: assigneeIds } },
          select: { id: true, fullName: true, avatarUrl: true },
        })
      : [];
    const assigneeMap = new Map(assignees.map((a) => [a.id, a]));

    const serialized = items.map((i) => ({
      id: i.id,
      pollId: i.pollId,
      title: i.title,
      category: i.category,
      latitude: i.latitude ? Number(i.latitude) : null,
      longitude: i.longitude ? Number(i.longitude) : null,
      address: i.address,
      assignee: i.assignedTo ? (assigneeMap.get(i.assignedTo) ?? null) : null,
      payload: i.payload,
      approvedAt: i.approvedAt,
    }));

    // Групуємо за категоріями для зручності фронта
    return {
      roomId,
      items: serialized,
      grouped: {
        decisions: serialized.filter((i) => i.category === 'decision'),
        locations: serialized.filter((i) => i.category === 'location'),
        items: serialized.filter((i) => i.category === 'item'),
      },
    };
  }
}
