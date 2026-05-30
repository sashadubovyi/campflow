import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

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

  // Швидкий пошук юзера за username — для подальших запрошень у кімнати
  @Get('lookup')
  lookupByUsername(@Query('username') username: string, @CurrentUser() viewer: AuthenticatedUser) {
    return this.usersService.lookupByUsername(username, viewer.id);
  }

  // Публічний профіль за username (з приватністю)
  @Get(':username')
  getPublicProfile(@Param('username') username: string, @CurrentUser() viewer: AuthenticatedUser) {
    return this.usersService.getPublicProfile(username, viewer.id);
  }
}
