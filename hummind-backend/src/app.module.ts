import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { MemoryModule } from './memory/memory.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';

/**
 * Module racine. Les fondations (config, prisma) sont globales.
 * Les modules métier (users, org, courses, ai, tutor, learner, gamification,
 * notifications, support, subscription, mail, contact, join, admin) seront
 * ajoutés ici au fur et à mesure de la reconstruction.
 */
@Module({
  imports: [ConfigModule, PrismaModule, AiModule, MemoryModule, HealthModule, AuthModule],
})
export class AppModule {}
