import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUserId } from 'src/auth/current-user.decorator';
import { UserGdprService } from 'src/admin/user-gdpr.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly gdpr: UserGdprService,
  ) {}

  @Post()
  @ApiCreatedResponse({ description: 'User created' })
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Get()
  @ApiOkResponse({ description: 'List users (paginated)' })
  findAll(@Query() q: QueryUserDto) {
    return this.users.findAll(q);
  }

  // GDPR — export des données du user connecté
  @Get('me/export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'JSON dump of the current user data (GDPR)' })
  async exportMe(@CurrentUserId() userId: string) {
    return this.gdpr.exportData({ userId });
  }

  // GDPR — self soft-delete
  @Delete('me/account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Soft-delete the current user account' })
  async deleteMe(
    @CurrentUserId() userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.gdpr.softDelete({
      actorId: userId,
      targetUserId: userId,
      reason: body?.reason ?? 'self-delete',
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Current user' })
  async me(@CurrentUserId() userId: string) {
    const fullUser = await this.users.findOne(userId);
    // Expose `role` to API consumers (short, stable shape) while the
    // database column is `platformRole`.
    const { platformRole, ...rest } =
      fullUser as typeof fullUser & { platformRole?: string };
    return {
      success: true,
      user: { ...rest, role: platformRole },
    };
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Get one user' })
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.users.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Update user' })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Delete user' })
  remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.users.remove(id);
  }
}
