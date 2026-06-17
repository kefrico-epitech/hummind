import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';

import { PrismaService } from '../prisma/prisma.service';
import { StatsController } from './stats.controller';

import { EntityModule } from '../entity/entity.module';

@Module({
  imports: [EntityModule],
  providers: [StatsService, PrismaService],
  controllers: [StatsController],
})
export class StatsModule {}
