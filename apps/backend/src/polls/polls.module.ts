import { Module } from '@nestjs/common';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';
import { PollsGateway } from './polls.gateway';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [RoomsModule],
  controllers: [PollsController],
  providers: [PollsService, PollsGateway],
  exports: [PollsService],
})
export class PollsModule {}
