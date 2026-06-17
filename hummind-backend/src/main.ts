import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common';
import type { Env } from './config/env.schema';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
  );

  const config = app.get(ConfigService<Env, true>);

  // Sécurité & cookies
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(fastifyCookie);

  // CORS (cookies cross-site → credentials)
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    credentials: true,
  });

  // Préfixe global + validation + filtre d'erreurs
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Documentation OpenAPI
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Hummind API')
    .setDescription("API de la plateforme d'apprentissage Hummind")
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = config.get('PORT', { infer: true });
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`🚀 Hummind API sur http://localhost:${port}/api/v1`);
}

void bootstrap();
