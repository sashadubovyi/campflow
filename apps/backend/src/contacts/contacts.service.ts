import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PresenceService } from '../presence/presence.service';
import { BlocksService } from '../blocks/blocks.service';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: PresenceService,
    private readonly blocks: BlocksService,
  ) {}

  /** Перевіряє, чи є userB у контактах userA. */
  async isContact(ownerId: string, contactId: string): Promise<boolean> {
    if (ownerId === contactId) return false;
    const c = await this.prisma.contact.findUnique({
      where: { ownerId_contactId: { ownerId, contactId } },
    });
    return !!c;
  }

  /** Перевіряє, чи додали один одного. */
  async isMutual(userA: string, userB: string): Promise<boolean> {
    if (userA === userB) return false;
    const [a, b] = await Promise.all([this.isContact(userA, userB), this.isContact(userB, userA)]);
    return a && b;
  }

  async addContact(ownerId: string, contactId: string) {
    if (ownerId === contactId) throw new BadRequestException('Cannot add yourself');

    const target = await this.prisma.user.findUnique({ where: { id: contactId } });
    if (!target) throw new NotFoundException('User not found');

    // Не можна додати до контактів заблокованого або від кого тебе заблокували
    const blocked = await this.blocks.isBlockedEitherWay(ownerId, contactId);
    if (blocked) throw new ForbiddenException('Cannot add this user');

    const existing = await this.prisma.contact.findUnique({
      where: { ownerId_contactId: { ownerId, contactId } },
    });
    if (existing) throw new ConflictException('Already in contacts');

    return this.prisma.contact.create({
      data: { ownerId, contactId },
    });
  }

  async removeContact(ownerId: string, contactId: string) {
    const existing = await this.prisma.contact.findUnique({
      where: { ownerId_contactId: { ownerId, contactId } },
    });
    if (!existing) throw new NotFoundException('Not in contacts');

    await this.prisma.contact.delete({
      where: { ownerId_contactId: { ownerId, contactId } },
    });
    return { removed: true };
  }

  async listContacts(ownerId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { ownerId },
      include: {
        contact: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatarUrl: true,
            lastSeenAt: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Витягаємо взаємність одним запитом
    const contactIds = contacts.map((c) => c.contactId);
    const mutuals = await this.prisma.contact.findMany({
      where: { ownerId: { in: contactIds }, contactId: ownerId },
      select: { ownerId: true },
    });
    const mutualSet = new Set(mutuals.map((m) => m.ownerId));

    return contacts.map((c) => ({
      id: c.id,
      addedAt: c.createdAt,
      isMutual: mutualSet.has(c.contactId),
      user: {
        ...c.contact,
        isOnline: this.presence.isOnline(c.contact.id),
      },
    }));
  }
}
