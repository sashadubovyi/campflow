import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PresenceService {
  // Множина онлайн userId — джерело правди в пам'яті процесу.
  // Для одного інстансу достатньо; на множинні інстанси перенесемо в Redis пізніше.
  private online = new Set<string>();

  constructor(private readonly prisma: PrismaService) {}

  async markOnline(userId: string): Promise<void> {
    this.online.add(userId);
    await this.touch(userId);
  }

  async markOffline(userId: string): Promise<void> {
    this.online.delete(userId);
    await this.touch(userId);
  }

  isOnline(userId: string): boolean {
    return this.online.has(userId);
  }

  getOnlineSet(userIds: string[]): Record<string, boolean> {
    return Object.fromEntries(userIds.map((id) => [id, this.online.has(id)]));
  }

  async touch(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
  }
}
