import { Module } from '@nestjs/common';
import { RoomLifecycleService } from './room-lifecycle.service';
import { RoomLifecycleController } from './room-lifecycle.controller';

@Module({
  controllers: [RoomLifecycleController],
  providers: [RoomLifecycleService],
  exports: [RoomLifecycleService],
})
export class RoomLifecycleModule {}
