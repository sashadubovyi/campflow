import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { FinalPlanService } from './final-plan.service';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class FinalPlanController {
  constructor(private readonly finalPlanService: FinalPlanService) {}

  @Post('polls/:id/approve')
  @HttpCode(HttpStatus.OK)
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.finalPlanService.approvePoll(user.id, id);
  }

  @Post('polls/:id/remove-from-plan')
  @HttpCode(HttpStatus.OK)
  removeFromPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.finalPlanService.removeFromPlanByPoll(user.id, id);
  }

  @Get('rooms/:roomId/final-plan')
  getPlan(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId', new ParseUUIDPipe()) roomId: string,
  ) {
    return this.finalPlanService.getRoomPlan(user.id, roomId);
  }
}
