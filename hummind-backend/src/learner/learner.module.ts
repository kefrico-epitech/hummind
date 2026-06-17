import { Module } from '@nestjs/common';
import { LearnerController } from './learner.controller';
import { LearnerService } from './learner.service';

@Module({
  controllers: [LearnerController],
  providers: [LearnerService],
})
export class LearnerModule {}
