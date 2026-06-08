import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MapService {
  constructor(private prisma: PrismaService) {}

  async getUserLocationPoints(userId: string) {
    // 1. Approved final plan items (category = 'location')
    //    Тільки з активних, не-архівованих кімнат.
    const finalItems = await this.prisma.finalPlanItem.findMany({
      where: {
        category: 'location',
        latitude: { not: null },
        longitude: { not: null },
        room: {
          status: 'active',
          archivedAt: null,
          members: { some: { userId } },
        },
      },
      include: { room: { select: { id: true, name: true, coverUrl: true } } },
      orderBy: { approvedAt: 'desc' },
    });

    // 2. PollOption candidates from location-type polls in user's rooms
    //    Тільки з активних, не-архівованих кімнат.
    const pollOptions = await this.prisma.pollOption.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        poll: {
          type: 'location',
          room: {
            status: 'active',
            archivedAt: null,
            members: { some: { userId } },
          },
        },
      },
      include: {
        poll: { select: { roomId: true, room: { select: { id: true, name: true, coverUrl: true } } } },
      },
    });

    const approvedIds = new Set(finalItems.map((i) => i.optionId).filter(Boolean));

    const fromFinal = finalItems.map((item) => ({
      id: item.id,
      roomId: item.roomId,
      roomName: item.room.name,
      roomCoverUrl: item.room.coverUrl,
      label: item.title,
      address: item.address,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      approved: true,
    }));

    const fromOptions = pollOptions
      .filter((o) => !approvedIds.has(o.id))
      .map((o) => ({
        id: o.id,
        roomId: o.poll.roomId,
        roomName: o.poll.room.name,
        roomCoverUrl: o.poll.room.coverUrl,
        label: o.label,
        address: o.address,
        latitude: Number(o.latitude),
        longitude: Number(o.longitude),
        approved: false,
      }));

    const result = [...fromFinal, ...fromOptions];
    console.log(
      `[MapService] userId=${userId} → finalItems=${finalItems.length} pollOptions=${pollOptions.length} total=${result.length}`,
    );
    return result;
  }
}
