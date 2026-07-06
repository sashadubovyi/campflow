import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PresenceService {
  // Лічильник активних сокетів на userId — джерело правди в пам'яті процесу.
  // Refcount, а не Set: юзер з двома вкладками, що закрив одну, все ще онлайн.
  // Для одного інстансу достатньо; на множинні інстанси перенесемо в Redis пізніше.
  private connections = new Map<string, number>();

  constructor(private readonly prisma: PrismaService) {}

  /** @returns true якщо це перше з'єднання юзера (перехід offline → online) */
  async markOnline(userId: string): Promise<boolean> {
    const count = (this.connections.get(userId) ?? 0) + 1;
    this.connections.set(userId, count);
    await this.touch(userId);
    return count === 1;
  }

  /** @returns true якщо це було останнє з'єднання юзера (перехід online → offline) */
  async markOffline(userId: string): Promise<boolean> {
    const count = (this.connections.get(userId) ?? 0) - 1;
    if (count <= 0) {
      this.connections.delete(userId);
    } else {
      this.connections.set(userId, count);
    }
    await this.touch(userId);
    return count <= 0;
  }

  isOnline(userId: string): boolean {
    return this.connections.has(userId);
  }

  getOnlineSet(userIds: string[]): Record<string, boolean> {
    return Object.fromEntries(userIds.map((id) => [id, this.connections.has(id)]));
  }

  async touch(userId: string): Promise<void> {
    // updateMany не кидає P2025 якщо юзера вже видалили — disconnect-хендлери
    // не мають права крашити процес через відсутній рядок.
    await this.prisma.user.updateMany({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });
  }
}
