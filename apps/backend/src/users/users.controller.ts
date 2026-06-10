import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

function imageFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: (err: Error | null, accept: boolean) => void,
) {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Only jpeg/png/webp allowed'), false);
  }
}

// Конвертуємо файл у base64 data URL для зберігання в БД.
// Це вирішує проблему ephemeral-filesystem на Railway (файли зникали після перезапуску).
function toDataUrl(file: Express.Multer.File): string {
  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
      fileFilter: imageFilter,
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB — достатньо для аватара
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.usersService.updateAvatar(user.id, toDataUrl(file));
  }

  @Post('me/cover')
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: memoryStorage(),
      fileFilter: imageFilter,
      limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB — cover, теж у БД
    }),
  )
  async uploadCover(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.usersService.updateCover(user.id, toDataUrl(file));
  }

  @Get('lookup')
  lookupByUsername(@Query('username') username: string, @CurrentUser() viewer: AuthenticatedUser) {
    return this.usersService.lookupByUsername(username, viewer.id);
  }

  @Get('search')
  search(
    @Query('q') q: string,
    @Query('by') by: 'auto' | 'username' | 'email' | 'phone' | 'name' = 'auto',
    @CurrentUser() viewer: AuthenticatedUser,
  ) {
    return this.usersService.searchUsers(q ?? '', by, viewer.id);
  }

  @Get(':username')
  getPublicProfile(@Param('username') username: string, @CurrentUser() viewer: AuthenticatedUser) {
    return this.usersService.getPublicProfile(username, viewer.id);
  }
}
