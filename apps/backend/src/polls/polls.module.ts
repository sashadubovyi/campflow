import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { PollsGateway } from './polls.gateway';

@Module({
  controllers: [PollsController],
  providers: [PollsService, PollsGateway],
  exports: [PollsService],
})
export class PollsModule {}
