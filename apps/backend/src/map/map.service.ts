import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MapService {
  constructor(private prisma: PrismaService) {}

  async getUserLocationPoints(userId: string) {
    // 1. Approved final plan items (category = 'location')
    const finalItems = await this.prisma.finalPlanItem.findMany({
      where: {
        category: 'location',
        latitude: { not: null },
        longitude: { not: null },
        room: { members: { some: { userId } } },
      },
      include: { room: { select: { id: true, name: true } } },
      orderBy: { approvedAt: 'desc' },
    });

    // 2. PollOption candidates from location-type polls in user's rooms
    const pollOptions = await this.prisma.pollOption.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        poll: {
          type: 'location',
          room: { members: { some: { userId } } },
        },
      },
      include: {
        poll: { select: { roomId: true, room: { select: { id: true, name: true } } } },
      },
    });

    const approvedIds = new Set(finalItems.map((i) => i.optionId).filter(Boolean));

    const fromFinal = finalItems.map((item) => ({
      id: item.id,
      roomId: item.roomId,
      roomName: item.room.name,
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
