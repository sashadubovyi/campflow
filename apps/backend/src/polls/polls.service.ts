import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePollDto } from './dto/create-poll.dto';
import { CreateMultiPollDto } from './dto/create-multi-poll.dto';
import { CreateLocationPollDto } from './dto/create-location-poll.dto';
import { AddLocationOptionDto } from './dto/add-location-option.dto';

@Injectable()
export class PollsService {
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

  async createSingleChoice(userId: string, dto: CreatePollDto) {
    await this.assertMember(userId, dto.roomId);

    const poll = await this.prisma.poll.create({
      data: {
        roomId: dto.roomId,
        authorId: userId,
        type: 'single_choice',
        title: dto.title,
        description: dto.description,
        options: {
          create: dto.options.map((o, idx) => ({
            label: o.label,
            position: idx,
          })),
        },
      },
      include: { options: { orderBy: { position: 'asc' } } },
    });

    return this.getPollResults(userId, poll.id);
  }

  async listRoomPolls(userId: string, roomId: string) {
    await this.assertMember(userId, roomId);

    const polls = await this.prisma.poll.findMany({
      where: { roomId },
      include: {
        options: { orderBy: { position: 'asc' } },
        _count: { select: { votes: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(polls.map((p) => this.getPollResults(userId, p.id)));
  }

  async getPollResults(userId: string, pollId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: {
        options: {
          orderBy: { position: 'asc' },
          include: { _count: { select: { votes: true } } },
        },
        votes: { select: { optionId: true, userId: true } },
        room: { select: { id: true } },
      },
    });

    if (!poll) throw new NotFoundException('Poll not found');
    await this.assertMember(userId, poll.roomId);

    // Скільки всього учасників у кімнаті (для прогресу X з Y)
    const totalMembers = await this.prisma.roomMember.count({
      where: { roomId: poll.roomId },
    });

    // Унікальні юзери, що проголосували
    const votedUserIds = new Set(poll.votes.map((v) => v.userId));

    // Голоси поточного юзера
    const myOptionIds = poll.votes.filter((v) => v.userId === userId).map((v) => v.optionId);

    return {
      id: poll.id,
      roomId: poll.roomId,
      type: poll.type,
      title: poll.title,
      description: poll.description,
      status: poll.status,
      allowAssign: poll.allowAssign,
      authorId: poll.authorId,
      createdAt: poll.createdAt,
      options: poll.options.map((o) => ({
        id: o.id,
        label: o.label,
        position: o.position,
        votes: o._count.votes,
        assignedTo: o.assignedTo,
        latitude: o.latitude ? Number(o.latitude) : null,
        longitude: o.longitude ? Number(o.longitude) : null,
        address: o.address,
      })),
      progress: {
        voted: votedUserIds.size,
        total: totalMembers,
      },
      myVotes: myOptionIds,
    };
  }

  async vote(userId: string, pollId: string, optionId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: { select: { id: true } } },
    });
    if (!poll) throw new NotFoundException('Poll not found');
    await this.assertMember(userId, poll.roomId);

    if (poll.status !== 'open' && poll.status !== 'reopened') {
      throw new BadRequestException('Poll is not open for voting');
    }

    const optionBelongs = poll.options.some((o) => o.id === optionId);
    if (!optionBelongs) {
      throw new BadRequestException('Option does not belong to this poll');
    }

    // single_choice: один голос на юзера. Транзакція: знести старі голоси + поставити новий.
    await this.prisma.$transaction(async (tx) => {
      await tx.pollVote.deleteMany({
        where: { pollId, userId },
      });
      await tx.pollVote.create({
        data: { pollId, optionId, userId },
      });
    });

    return this.getPollResults(userId, pollId);
  }

  async closePoll(userId: string, pollId: string) {
    const poll = await this.prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll) throw new NotFoundException('Poll not found');
    await this.assertAdmin(userId, poll.roomId);

    await this.prisma.poll.update({
      where: { id: pollId },
      data: { status: 'closed', closedAt: new Date() },
    });

    return this.getPollResults(userId, pollId);
  }

  async reopenPoll(userId: string, pollId: string) {
    const poll = await this.prisma.poll.findUnique({ where: { id: pollId } });
    if (!poll) throw new NotFoundException('Poll not found');
    await this.assertAdmin(userId, poll.roomId);

    await this.prisma.poll.update({
      where: { id: pollId },
      data: { status: 'reopened', closedAt: null, approvedAt: null },
    });

    return this.getPollResults(userId, pollId);
  }

  async createMultiChoice(userId: string, dto: CreateMultiPollDto) {
    await this.assertMember(userId, dto.roomId);

    const poll = await this.prisma.poll.create({
      data: {
        roomId: dto.roomId,
        authorId: userId,
        type: 'multi_choice',
        title: dto.title,
        description: dto.description,
        allowAssign: dto.allowAssign ?? false,
        options: {
          create: dto.options.map((o, idx) => ({
            label: o.label,
            position: idx,
          })),
        },
      },
    });

    return this.getPollResults(userId, poll.id);
  }

  async toggleVote(userId: string, pollId: string, optionId: string) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: { select: { id: true } } },
    });
    if (!poll) throw new NotFoundException('Poll not found');
    await this.assertMember(userId, poll.roomId);

    if (poll.type !== 'multi_choice') {
      throw new BadRequestException('toggleVote is only for multi_choice polls');
    }
    if (poll.status !== 'open' && poll.status !== 'reopened') {
      throw new BadRequestException('Poll is not open for voting');
    }
    if (!poll.options.some((o) => o.id === optionId)) {
      throw new BadRequestException('Option does not belong to this poll');
    }

    // Перемикач: якщо голос є — знімаємо, якщо немає — ставимо
    const existing = await this.prisma.pollVote.findUnique({
      where: { optionId_userId: { optionId, userId } },
    });

    if (existing) {
      await this.prisma.pollVote.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.pollVote.create({
        data: { pollId, optionId, userId },
      });
    }

    return this.getPollResults(userId, pollId);
  }

  async assignOption(userId: string, optionId: string, assignedTo: string | null) {
    const option = await this.prisma.pollOption.findUnique({
      where: { id: optionId },
      include: { poll: { select: { id: true, roomId: true, allowAssign: true, type: true } } },
    });
    if (!option) throw new NotFoundException('Option not found');
    await this.assertMember(userId, option.poll.roomId);

    if (!option.poll.allowAssign) {
      throw new BadRequestException('This poll does not allow assignments');
    }

    // Якщо закріплюємо за кимось — переконуємось, що він учасник кімнати
    if (assignedTo) {
      const member = await this.prisma.roomMember.findUnique({
        where: { roomId_userId: { roomId: option.poll.roomId, userId: assignedTo } },
      });
      if (!member) throw new BadRequestException('Assignee is not a member of this room');
    }

    await this.prisma.pollOption.update({
      where: { id: optionId },
      data: { assignedTo },
    });

    return this.getPollResults(userId, option.poll.id);
  }

  async createLocationPoll(userId: string, dto: CreateLocationPollDto) {
    await this.assertMember(userId, dto.roomId);

    const poll = await this.prisma.poll.create({
      data: {
        roomId: dto.roomId,
        authorId: userId,
        type: 'location',
        title: dto.title,
        description: dto.description,
        options: {
          create: dto.options.map((o, idx) => ({
            label: o.label,
            position: idx,
            latitude: o.latitude,
            longitude: o.longitude,
            address: o.address,
          })),
        },
      },
    });

    return this.getPollResults(userId, poll.id);
  }

  async addLocationOption(userId: string, pollId: string, dto: AddLocationOptionDto) {
    const poll = await this.prisma.poll.findUnique({
      where: { id: pollId },
      include: { options: { select: { position: true } } },
    });
    if (!poll) throw new NotFoundException('Poll not found');
    await this.assertMember(userId, poll.roomId);

    if (poll.type !== 'location') {
      throw new BadRequestException('Can only add location options to a location poll');
    }
    if (poll.status !== 'open' && poll.status !== 'reopened') {
      throw new BadRequestException('Poll is not open');
    }

    const nextPosition = poll.options.length;

    await this.prisma.pollOption.create({
      data: {
        pollId,
        label: dto.label,
        position: nextPosition,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
      },
    });

    return this.getPollResults(userId, pollId);
  }
}
