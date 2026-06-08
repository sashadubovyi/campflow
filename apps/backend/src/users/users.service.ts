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

    // Статистика для публічного профілю
    const [contactsCount, sharedRoomsCount] = await Promise.all([
      this.prisma.contact.count({ where: { ownerId: user.id } }),
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
