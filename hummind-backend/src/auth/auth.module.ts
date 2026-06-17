import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    // RolesGuard appliqué globalement : il ne restreint que les routes
    // décorées par @Roles(...) ; sinon il laisse passer.
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
