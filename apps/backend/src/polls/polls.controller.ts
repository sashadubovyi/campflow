import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { PollsService } from './polls.service';
import { PollsGateway } from './polls.gateway';
import { CreatePollDto } from './dto/create-poll.dto';
import { VoteDto } from './dto/vote.dto';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { CreateMultiPollDto } from './dto/create-multi-poll.dto';
import { AssignOptionDto } from './dto/assign-option.dto';
import { CreateLocationPollDto } from './dto/create-location-poll.dto';
import { AddLocationOptionDto } from './dto/add-location-option.dto';

@Controller('polls')
export class PollsController {
  constructor(
    private readonly pollsService: PollsService,
    private readonly pollsGateway: PollsGateway,
  ) {}

  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePollDto) {
    const poll = await this.pollsService.createSingleChoice(user.id, dto);
    this.pollsGateway.broadcastPollCreated(poll.roomId, poll);
    return poll;
  }

  @Get('room/:roomId')
  listRoomPolls(
    @CurrentUser() user: AuthenticatedUser,
    @Param('roomId', new ParseUUIDPipe()) roomId: string,
  ) {
    return this.pollsService.listRoomPolls(user.id, roomId);
  }

  @Get(':id')
  getPoll(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.pollsService.getPollResults(user.id, id);
  }

  @Post(':id/vote')
  @HttpCode(HttpStatus.OK)
  async vote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: VoteDto,
  ) {
    const poll = await this.pollsService.vote(user.id, id, dto.optionId);
    this.pollsGateway.broadcastPollUpdate(poll.roomId, poll);
    return poll;
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  async close(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const poll = await this.pollsService.closePoll(user.id, id);
    this.pollsGateway.broadcastPollUpdate(poll.roomId, poll);
    return poll;
  }

  @Post(':id/reopen')
  @HttpCode(HttpStatus.OK)
  async reopen(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    const poll = await this.pollsService.reopenPoll(user.id, id);
    this.pollsGateway.broadcastPollUpdate(poll.roomId, poll);
    return poll;
  }

  @Post('multi')
  async createMulti(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMultiPollDto) {
    const poll = await this.pollsService.createMultiChoice(user.id, dto);
    this.pollsGateway.broadcastPollCreated(poll.roomId, poll);
    return poll;
  }

  @Post(':id/toggle-vote')
  @HttpCode(HttpStatus.OK)
  async toggleVote(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: VoteDto,
  ) {
    const poll = await this.pollsService.toggleVote(user.id, id, dto.optionId);
    this.pollsGateway.broadcastPollUpdate(poll.roomId, poll);
    return poll;
  }

  @Post('options/:optionId/assign')
  @HttpCode(HttpStatus.OK)
  async assign(
    @CurrentUser() user: AuthenticatedUser,
    @Param('optionId', new ParseUUIDPipe()) optionId: string,
    @Body() dto: AssignOptionDto,
  ) {
    const poll = await this.pollsService.assignOption(user.id, optionId, dto.assignedTo ?? null);
    this.pollsGateway.broadcastPollUpdate(poll.roomId, poll);
    return poll;
  }

  @Post('location')
  async createLocation(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLocationPollDto) {
    const poll = await this.pollsService.createLocationPoll(user.id, dto);
    this.pollsGateway.broadcastPollCreated(poll.roomId, poll);
    return poll;
  }

  @Post(':id/location-option')
  @HttpCode(HttpStatus.OK)
  async addLocationOption(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AddLocationOptionDto,
  ) {
    const poll = await this.pollsService.addLocationOption(user.id, id, dto);
    this.pollsGateway.broadcastPollUpdate(poll.roomId, poll);
    return poll;
  }
}
