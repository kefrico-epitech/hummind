import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MAIL_QUEUE_NAME } from './queue.constants';

// Module global qui configure la connexion Redis pour BullMQ et déclare
// les queues utilisées par l'application. @Global pour que @InjectQueue(...)
// fonctionne dans tout service sans avoir à réimporter QueueModule.
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        connection: {
          host: cfg.get<string>('REDIS_HOST') ?? 'localhost',
          port: Number(cfg.get<string>('REDIS_PORT') ?? 6380),
          password: cfg.get<string>('REDIS_PASSWORD') || undefined,
        },
        // Defaults applied to every job pushed unless overridden:
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: { age: 3600, count: 1000 }, // garde 1h ou 1000 jobs
          removeOnFail: { age: 24 * 3600 },             // garde 24h sur échec
        },
      }),
    }),
    BullModule.registerQueue({
      name: MAIL_QUEUE_NAME,
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
