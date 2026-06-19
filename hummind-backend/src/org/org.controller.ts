import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthedRequest } from '../auth/types';
import { OrgService } from './org.service';

@ApiTags('org')
@UseGuards(JwtAuthGuard)
@Controller('org')
export class OrgController {
  constructor(private readonly org: OrgService) {}

  @Get('mine')
  mine(@CurrentUser() userId: string, @Req() req: FastifyRequest & AuthedRequest) {
    return this.org.mine(userId, req.userRole);
  }
}
