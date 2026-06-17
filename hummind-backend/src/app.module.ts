import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { EntityModule } from './entity/entity.module';
import { EntityMembersModule } from './entity-members/entity-members.module';
import { CourseModule } from './module/course.module';
import { CategoryModule } from './category/category.module';
import { NotificationsModule } from './notifications/notifications.module';

import { StatsModule } from './stats/stats.module';
import { SearchModule } from './search/search.module';
import { LearnerModule } from './learner/learner.module';
import { AiModule } from './ai/ai.module';
import { ContactModule } from './contact/contact.module';
import { AdminModule } from './admin/admin.module';
import { QueueModule } from './queue/queue.module';
import { JoinModule } from './join/join.module';
import { MaintenanceModule } from './maintenance/maintenance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    PrismaModule, // <- indispensable (au moins une fois si @Global)
    QueueModule,  // Redis + BullMQ (global)
    MailModule,
    AuthModule,
    UsersModule,
    EntityModule,
    CourseModule,
    EntityMembersModule,
    CategoryModule,
    NotificationsModule,
    StatsModule,
    SearchModule,
    LearnerModule,
    AiModule,
    ContactModule,
    AdminModule,
    JoinModule,
    MaintenanceModule,
  ],
})
export class AppModule {}
