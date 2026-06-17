import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { AdminModule } from '../admin/admin.module';
import { JoinController } from './join.controller';
import { JoinService } from './join.service';

@Module({
  imports: [PrismaModule, AuthModule, MailModule, AdminModule],
  controllers: [JoinController],
  providers: [JoinService],
  exports: [JoinService],
})
export class JoinModule {}
