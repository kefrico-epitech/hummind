import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { StatsService } from './stats.service';
import { CurrentUserId } from '../auth/current-user.decorator';

@ApiTags('stats')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('dashboard')
  @ApiOperation({
    summary:
      'Get global dashboard statistics adapted to the current user access (Owner, Admin, Member)',
  })
  async getGlobalDashboard(@CurrentUserId() userId: string) {
    return this.statsService.getGlobalStats(userId);
  }
}
