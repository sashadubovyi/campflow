import { Module } from '@nestjs/common';
import { FinalPlanController } from './final-plan.controller';
import { FinalPlanService } from './final-plan.service';

@Module({
  controllers: [FinalPlanController],
  providers: [FinalPlanService],
  exports: [FinalPlanService],
})
export class FinalPlanModule {}
