import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PresenceService } from '../presence/presence.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presence: PresenceService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        locale: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        locale: dto.locale,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        locale: true,
        createdAt: true,
      },
    });
    return user;
  }

  // === Пошук юзера за username (для майбутніх запрошень) ===
  async lookupByUsername(username: string) {
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
    return user;
  }

  // === Публічний профіль з приватністю на рівні поля ===
  async getPublicProfile(username: string, viewerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (!user) throw new NotFoundException('User not found');

    // Чи viewer є в контактах user'а? (для Блоку 9 — поки завжди false)
    const isContact = false;

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
    };
  }
}
