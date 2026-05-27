import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ListMessagesDto } from './dto/list-messages.dto';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Controller('rooms/:roomId/messages')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId', new ParseUUIDPipe()) roomId: string,
    @Query() query: ListMessagesDto,
  ) {
    return this.chatService.listMessages(user.id, roomId, query);
  }
}
