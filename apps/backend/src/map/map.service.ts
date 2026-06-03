import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MapService {
  constructor(private prisma: PrismaService) {}

  async getUserLocationPoints(userId: string) {
    const items = await this.prisma.finalPlanItem.findMany({
      where: {
        category: 'location',
        latitude: { not: null },
        longitude: { not: null },
        room: {
          members: { some: { userId } },
        },
      },
      include: {
        room: { select: { id: true, name: true } },
      },
      orderBy: { approvedAt: 'desc' },
    });

    return items.map((item) => ({
      id: item.id,
      roomId: item.roomId,
      roomName: item.room.name,
      label: item.title,
      address: item.address,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
    }));
  }
}
