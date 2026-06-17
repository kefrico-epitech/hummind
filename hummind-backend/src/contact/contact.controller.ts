import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { ContactService } from './contact.service';
import { CreateContactMessageDto } from './contact.dto';

interface RequestWithMaybeUser extends FastifyRequest {
  user?: { id?: string };
}

@Controller('contact')
export class ContactController {
  constructor(private readonly contact: ContactService) {}

  // Public: no JwtAuthGuard. Optional userId is captured if a valid token
  // happens to be present (handled by the global passport pipeline elsewhere).
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: CreateContactMessageDto,
    @Req() req: RequestWithMaybeUser,
  ): Promise<{ id: string }> {
    return this.contact.create(body, req.user?.id);
  }
}
