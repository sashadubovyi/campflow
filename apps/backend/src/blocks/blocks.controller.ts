import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('blocks')
export class BlocksController {
  constructor(private readonly blocksService: BlocksService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.blocksService.listBlocked(user.id);
  }

  @Post()
  block(@CurrentUser() user: AuthenticatedUser, @Body() body: { userId: string; reason?: string }) {
    return this.blocksService.block(user.id, body.userId, body.reason);
  }

  @Delete(':userId')
  unblock(@CurrentUser() user: AuthenticatedUser, @Param('userId') userId: string) {
    return this.blocksService.unblock(user.id, userId);
  }
}
