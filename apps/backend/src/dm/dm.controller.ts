import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { DmService } from './dm.service';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { SendDmMessageDto } from './dto/send-dm-message.dto';

@Controller('dm')
export class DmController {
  constructor(private readonly dm: DmService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.dm.listMyChats(user.id);
  }

  /** Знайти/створити DM-чат із юзером за username. */
  @Get('with/:username')
  getOrCreate(
    @CurrentUser() user: AuthenticatedUser,
    @Param('username') username: string,
  ) {
    return this.dm.getOrCreateChatWith(user.id, username);
  }

  @Get(':chatId')
  getChat(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chatId', new ParseUUIDPipe()) chatId: string,
  ) {
    return this.dm.getChat(user.id, chatId);
  }

  @Get(':chatId/messages')
  getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chatId', new ParseUUIDPipe()) chatId: string,
  ) {
    return this.dm.getMessages(user.id, chatId);
  }

  @Delete(':chatId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteChat(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chatId', new ParseUUIDPipe()) chatId: string,
  ) {
    return this.dm.deleteChat(user.id, chatId);
  }

  @Post(':chatId/messages')
  @HttpCode(HttpStatus.OK)
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chatId', new ParseUUIDPipe()) chatId: string,
    @Body() dto: SendDmMessageDto,
  ) {
    return this.dm.sendMessage(user.id, chatId, dto.content);
  }
}
