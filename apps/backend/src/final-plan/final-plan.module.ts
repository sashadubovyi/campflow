import { Module } from '@nestjs/common';
import { FinalPlanController } from './final-plan.controller';
import { FinalPlanService } from './final-plan.service';
import { PollsModule } from '../polls/polls.module';

@Module({
  imports: [PollsModule],
  controllers: [FinalPlanController],
  providers: [FinalPlanService],
  exports: [FinalPlanService],
})
export class FinalPlanModule {}
