import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  // Перевірка перед показом кнопки на фронті
  @Get('rooms/:roomId/can-invite')
  canInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Query('username') username: string,
  ) {
    return this.invitesService.canInvite(user.id, username, roomId);
  }

  @Post('rooms/:roomId/invites')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId') roomId: string,
    @Body() body: CreateInviteDto,
  ) {
    return this.invitesService.createInvite(user.id, body.username, roomId, body.message);
  }

  @Get('invites/incoming')
  myPending(@CurrentUser() user: AuthenticatedUser) {
    return this.invitesService.myPending(user.id);
  }

  @Post('invites/:id/accept')
  accept(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.invitesService.accept(user.id, id);
  }

  @Post('invites/:id/decline')
  decline(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.invitesService.decline(user.id, id);
  }

  @Post('invites/:id/defer')
  defer(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.invitesService.defer(user.id, id);
  }
}
