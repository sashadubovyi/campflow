import {
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { RoomLifecycleService } from './room-lifecycle.service';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller()
export class RoomLifecycleController {
  constructor(private readonly lifecycleService: RoomLifecycleService) {}

  @Post('rooms/:id/close')
  @HttpCode(HttpStatus.OK)
  closeRoom(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.lifecycleService.closeRoom(user.id, id);
  }

  @Post('dev/run-lifecycle')
  @HttpCode(HttpStatus.OK)
  runLifecycle() {
    // Manual trigger for the destructive lifecycle sweep — dev/test only.
    // In production this must not be callable by regular users.
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }
    return this.lifecycleService.runLifecycleNow();
  }
}
