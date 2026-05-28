import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateChecklistDto } from './dto/generate-checklist.dto';
import { CheckDuplicateDto } from './dto/check-duplicate.dto';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('checklist')
  @HttpCode(HttpStatus.OK)
  generateChecklist(@CurrentUser() user: AuthenticatedUser, @Body() dto: GenerateChecklistDto) {
    return this.aiService.generateChecklist(user.id, dto.description, user.locale);
  }

  @Post('check-duplicate')
  @HttpCode(HttpStatus.OK)
  async checkDuplicate(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckDuplicateDto) {
    const existing = await this.prisma.poll.findMany({
      where: { roomId: dto.roomId },
      select: { title: true },
    });
    const titles = existing.map((p) => p.title);
    return this.aiService.checkDuplicate(user.id, dto.title, titles, user.locale);
  }
}
