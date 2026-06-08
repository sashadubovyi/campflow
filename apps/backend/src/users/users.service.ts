import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PresenceService } from '../presence/presence.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ContactsService } from '../contacts/contacts.service';
import { BlocksService } from '../blocks/blocks.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: PresenceService,
    private readonly contacts: ContactsService,
    private readonly blocks: BlocksService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      locale: user.locale,
      bio: user.bio,
      city: user.city,
      birthDate: user.birthDate,
      gender: user.gender,
      hobbies: user.hobbies,
      hobbiesCustom: user.hobbiesCustom,
      telegram: user.telegram,
      whatsapp: user.whatsapp,
      instagram: user.instagram,
      facebook: user.facebook,
      emailVisibility: user.emailVisibility,
      phoneVisibility: user.phoneVisibility,
      telegramVisibility: user.telegramVisibility,
      whatsappVisibility: user.whatsappVisibility,
      instagramVisibility: user.instagramVisibility,
      facebookVisibility: user.facebookVisibility,
      inviteFrom: user.inviteFrom,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        locale: dto.locale,
        bio: dto.bio,
        city: dto.city,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : dto.birthDate,
        gender: dto.gender,
        hobbies: dto.hobbies,
        hobbiesCustom: dto.hobbiesCustom,
        telegram: dto.telegram,
        whatsapp: dto.whatsapp,
        instagram: dto.instagram,
        facebook: dto.facebook,
        emailVisibility: dto.emailVisibility,
        phoneVisibility: dto.phoneVisibility,
        telegramVisibility: dto.telegramVisibility,
        whatsappVisibility: dto.whatsappVisibility,
        instagramVisibility: dto.instagramVisibility,
        facebookVisibility: dto.facebookVisibility,
        inviteFrom: dto.inviteFrom,
      },
    });
    return this.getProfile(user.id);
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });
    return { avatarUrl };
  }

  async updateCover(userId: string, coverUrl: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { coverUrl },
    });
    return { coverUrl };
  }

  // === Пошук юзерів за username / email / phone / fullName ===
  // by='auto' — пробуємо визначити поле за формою q.
  // Email і phone шукаються тільки серед юзерів з visibility='public' для
  // відповідного поля, щоб уникнути enumeration-атак.
  async searchUsers(
    rawQuery: string,
    by: 'auto' | 'username' | 'email' | 'phone' | 'name',
    viewerId: string,
  ) {
    const q = rawQuery.trim();
    if (q.length < 2) return [];

    const mode = by === 'auto' ? this.detectSearchMode(q) : by;

    let where: import('@prisma/client').Prisma.UserWhereInput;
    switch (mode) {
      case 'username': {
        const stripped = q.replace(/^@/, '').toLowerCase();
        where = { username: { contains: stripped, mode: 'insensitive' } };
        break;
      }
      case 'email': {
        where = {
          email: { contains: q.toLowerCase(), mode: 'insensitive' },
          emailVisibility: 'public',
        };
        break;
      }
      case 'phone': {
        const digits = q.replace(/\D+/g, '');
        if (digits.length < 4) return [];
        where = {
          phone: { contains: digits },
          phoneVisibility: 'public',
        };
        break;
      }
      case 'name':
      default: {
        where = { fullName: { contains: q, mode: 'insensitive' } };
        break;
      }
    }

    const users = await this.prisma.user.findMany({
      where: { ...where, NOT: { id: viewerId } },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        city: true,
        lastSeenAt: true,
      },
      orderBy: { fullName: 'asc' },
      take: 20,
    });

    if (users.length === 0) return [];

    // Прибираємо тих, кого viewer заблокував або хто заблокував viewer'а.
    const userIds = users.map((u) => u.id);
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: { in: userIds } },
          { blockedId: viewerId, blockerId: { in: userIds } },
        ],
      },
      select: { blockerId: true, blockedId: true },
    });
    const blockedSet = new Set<string>(
      blocks.map((b) => (b.blockerId === viewerId ? b.blockedId : b.blockerId)),
    );

    return users
      .filter((u) => !blockedSet.has(u.id))
      .map((u) => ({
        ...u,
        isOnline: this.presence.isOnline(u.id),
      }));
  }

  private detectSearchMode(q: string): 'username' | 'email' | 'phone' | 'name' {
    if (q.startsWith('@')) return 'username';
    if (q.includes('@') && q.includes('.')) return 'email';
    if (/^\+?[\d\s\-()]+$/.test(q) && q.replace(/\D+/g, '').length >= 4) return 'phone';
    return 'name';
  }

  // === Пошук юзера за username (для майбутніх запрошень) ===
  async lookupByUsername(username: string, viewerId: string) {
    if (!username || username.length < 2) {
      throw new BadRequestException('username is required');
    }
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatarUrl: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    // Якщо хтось із них заблокував іншого — вдаємо що юзера не існує
    const blocked = await this.blocks.isBlockedEitherWay(viewerId, user.id);
    if (blocked) throw new NotFoundException('User not found');

    return user;
  }

  // === Публічний профіль з приватністю на рівні поля ===
  async getPublicProfile(username: string, viewerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (!user) throw new NotFoundException('User not found');
    // Заблоковані не бачать один одного
    if (user.id !== viewerId) {
      const blocked = await this.blocks.isBlockedEitherWay(viewerId, user.id);
      if (blocked) throw new NotFoundException('User not found');
    }

    // Чи viewer є в контактах user'а? (для Блоку 9 — поки завжди false)
    const isContact = await this.contacts.isContact(viewerId, user.id);
    const isMutual = await this.contacts.isMutual(viewerId, user.id);

    // Статистика для публічного профілю. Для нових юзерів count = 0;
    // навіть якщо запит зламається — повертаємо 0, щоб профіль не падав на 500.
    const safeCount = async (p: Promise<number>): Promise<number> => {
      try {
        return await p;
      } catch {
        return 0;
      }
    };
    const [contactsCount, sharedRoomsCount] = await Promise.all([
      safeCount(this.prisma.contact.count({ where: { ownerId: user.id } })),
      safeCount(
        user.id === viewerId
          ? this.prisma.roomMember.count({
              where: { userId: user.id, room: { archivedAt: null } },
            })
          : this.prisma.room.count({
              where: {
                archivedAt: null,
                AND: [
                  { members: { some: { userId: user.id } } },
                  { members: { some: { userId: viewerId } } },
                ],
              },
            }),
      ),
    ]);

    // Хелпер: чи показувати поле згідно з visibility
    const canSee = (visibility: 'public' | 'contacts' | 'hidden') => {
      if (user.id === viewerId) return true;
      if (visibility === 'public') return true;
      if (visibility === 'contacts' && isContact) return true;
      return false;
    };

    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      bio: user.bio,
      city: user.city,
      birthDate: user.birthDate,
      gender: user.gender,
      hobbies: user.hobbies,
      hobbiesCustom: user.hobbiesCustom,
      isOnline: this.presence.isOnline(user.id),
      lastSeenAt: user.lastSeenAt,

      // Контакти — згідно з visibility (null якщо приховано)
      email: canSee(user.emailVisibility) ? user.email : null,
      phone: canSee(user.phoneVisibility) ? user.phone : null,
      telegram: canSee(user.telegramVisibility) ? user.telegram : null,
      whatsapp: canSee(user.whatsappVisibility) ? user.whatsapp : null,
      instagram: canSee(user.instagramVisibility) ? user.instagram : null,
      facebook: canSee(user.facebookVisibility) ? user.facebook : null,

      // UI-зручність
      isSelf: user.id === viewerId,
      isContact,
      isMutual,

      // Статистика (Хвиля D)
      createdAt: user.createdAt,
      stats: {
        sharedRooms: sharedRoomsCount,
        contacts: contactsCount,
      },
    };
  }
}
