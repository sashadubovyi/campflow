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
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

const avatarStorage = diskStorage({
  destination: join(__dirname, '..', '..', 'uploads', 'avatars'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

const coverStorage = diskStorage({
  destination: join(__dirname, '..', '..', 'uploads', 'profile-covers'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

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
      storage: avatarStorage,
      fileFilter: imageFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.usersService.updateAvatar(user.id, avatarUrl);
  }

  @Post('me/cover')
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: coverStorage,
      fileFilter: imageFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadCover(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const coverUrl = `/uploads/profile-covers/${file.filename}`;
    return this.usersService.updateCover(user.id, coverUrl);
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
