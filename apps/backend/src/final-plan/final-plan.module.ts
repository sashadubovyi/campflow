import { Module } from '@nestjs/common';
import { FinalPlanController } from './final-plan.controller';
import { FinalPlanService } from './final-plan.service';
import { PollsGateway } from '../polls/polls.gateway';

@Module({
  controllers: [FinalPlanController],
  providers: [FinalPlanService, PollsGateway],
  exports: [FinalPlanService],
})
export class FinalPlanModule {}
