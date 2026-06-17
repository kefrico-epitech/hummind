import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';

/**
 * Filtre global : normalise les erreurs en `{ statusCode, code, message }`.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Une erreur interne est survenue.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        const r = res as Record<string, unknown>;
        message = (r.message as string) ?? message;
        code = (r.code as string) ?? exception.name;
        if (Array.isArray(r.message)) message = (r.message as string[]).join(', ');
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    void reply.status(status).send({ statusCode: status, code, message });
  }
}
