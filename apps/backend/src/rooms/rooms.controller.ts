import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { AiService } from '../ai/ai.service';
import { AiDraftRoomDto } from './dto/ai-draft-room.dto';
import { AiCommitRoomDto } from './dto/ai-commit-room.dto';

const coverStorage = diskStorage({
  destination: join(__dirname, '..', '..', 'uploads', 'covers'),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname)}`);
  },
});

function coverFilter(
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

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly aiService: AiService,
  ) {}

  @Post('ai-draft')
  @HttpCode(HttpStatus.OK)
  async aiDraft(@CurrentUser() user: AuthenticatedUser, @Body() dto: AiDraftRoomDto) {
    const draft = await this.aiService.generateRoomDraft(user.id, dto.prompt, user.locale ?? 'uk');
    if (!draft) {
      return { error: 'AI unavailable' };
    }
    return draft;
  }

  @Post('ai-commit')
  @HttpCode(HttpStatus.OK)
  async aiCommit(@CurrentUser() user: AuthenticatedUser, @Body() dto: AiCommitRoomDto) {
    return this.roomsService.commitRoomDraft(user.id, dto);
  }

  @Get()
  listMyRooms(@CurrentUser() user: AuthenticatedUser) {
    return this.roomsService.listMyRooms(user.id);
  }

  @Get('public')
  listPublic(@CurrentUser() user: AuthenticatedUser) {
    return this.roomsService.listPublicRooms(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRoomDto) {
    return this.roomsService.createRoom(user.id, dto);
  }

  @Post('join')
  @HttpCode(HttpStatus.OK)
  join(@CurrentUser() user: AuthenticatedUser, @Body() dto: JoinRoomDto) {
    return this.roomsService.joinByCode(user.id, dto.inviteCode);
  }

  @Post(':id/join-public')
  @HttpCode(HttpStatus.OK)
  joinPublic(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.roomsService.joinPublic(user.id, id);
  }

  @Get(':id')
  getRoom(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.roomsService.getRoom(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomsService.updateRoom(user.id, id, dto);
  }

  @Post(':id/cover')
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: coverStorage,
      fileFilter: coverFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async uploadCover(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const coverUrl = `/uploads/covers/${file.filename}`;
    return this.roomsService.updateCover(user.id, id, coverUrl);
  }

  @Post(':id/regenerate-invite')
  @HttpCode(HttpStatus.OK)
  regenerateInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return this.roomsService.regenerateInvite(user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.roomsService.archiveRoom(user.id, id);
  }

  @Delete(':id/members/me')
  @HttpCode(HttpStatus.OK)
  leave(@CurrentUser() user: AuthenticatedUser, @Param('id', new ParseUUIDPipe()) id: string) {
    return this.roomsService.leaveRoom(user.id, id);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.OK)
  removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
  ) {
    return this.roomsService.removeMember(user.id, id, memberId);
  }

  @Patch(':id/members/:memberId/role')
  @HttpCode(HttpStatus.OK)
  transferAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('memberId', new ParseUUIDPipe()) memberId: string,
  ) {
    return this.roomsService.transferAdmin(user.id, id, memberId);
  }
}
