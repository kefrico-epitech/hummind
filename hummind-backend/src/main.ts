import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { FastifyRequest, FastifyReply } from 'fastify';

// Plugins Fastify
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';

// FS + path (méthode 1)
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// 👉 util pour IDs de requête
import { randomUUID } from 'crypto';

// 👉 pour récupérer toutes les IP locales
import * as os from 'node:os';

// Custom interface for request with metadata
interface RequestWithMeta extends FastifyRequest {
  rid: string;
  start: bigint;
}

interface OpenApiOperation {
  security?: any[];
  [key: string]: any;
}

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';
  const port = Number(process.env.PORT ?? 3000);

  // 📂 Dossier & chemin du fichier de logs
  const logDir = join(process.cwd(), 'logs');
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  const logFilePath = join(logDir, 'app.log');

  // 🔧 Config logger Fastify (multistream via transport)
  const logger = {
    level: isProd ? 'info' : 'debug',
    transport: isProd
      ? {
          targets: [
            {
              target: 'pino/file',
              options: { destination: logFilePath, mkdir: true },
              level: 'info',
            },
          ],
        }
      : {
          targets: [
            {
              target: 'pino-pretty',
              options: { colorize: true, singleLine: true },
              level: 'debug',
            },
            {
              target: 'pino/file',
              options: { destination: logFilePath, mkdir: true },
              level: 'debug',
            },
          ],
        },
  } as const;

  // ✅ trustProxy + bodyLimit + logger config object (Fastify v5)
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger,
      trustProxy: true,
      bodyLimit: 5 * 1024 * 1024, // 5MB
    }),
  );

  // Préfixe global
  app.setGlobalPrefix('api/v1');

  // Plugins Fastify
  await app.register(cors, {
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders: ['*'],
    exposedHeaders: [
      'Content-Length',
      'Content-Type',
      'X-Request-Id',
      'X-Response-Time',
    ],
    maxAge: 86400,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  await app.register(compress, {
    global: true,
    encodings: ['gzip', 'deflate', 'br'],
    threshold: 1024,
  });

  await app.register(cookie, {
    secret: process.env.COOKIE_SECRET || 'dev-cookie-secret',
    parseOptions: { sameSite: 'lax', httpOnly: true, secure: isProd },
  });

  // ✅ Rate limit — global 300/min, par-route plus strict sur ce qui est sensible
  // Flow v2.0 — anti brute-force et anti-spam.
  // Patterns (regex) — chaque entrée surcharge la limite globale.
  const STRICT_ROUTES: Array<{ pattern: RegExp; max: number; windowMs: number }> = [
    // Authentification & finalisation : 5/min/IP
    { pattern: /\/api\/v1\/auth\/(signin|finalize|google)$/, max: 5, windowMs: 60_000 },
    // Reset password (anti-énumération d'emails)
    { pattern: /\/api\/v1\/auth\/(reset-password|recovery-password)$/, max: 5, windowMs: 60_000 },
    // Form public (anti-spam de demandes)
    { pattern: /\/api\/v1\/contact$/, max: 3, windowMs: 60_000 },
    // Inscription apprenant via lien public
    { pattern: /\/api\/v1\/public\/join\/[^/]+\/signup$/, max: 5, windowMs: 60_000 },
    // Vérification OTP (un peu plus permissif — typos)
    { pattern: /\/api\/v1\/public\/verify-email$/, max: 10, windowMs: 60_000 },
  ];

  await app.register(rateLimit, {
    allowList: (req: FastifyRequest, _key: string) => {
      const url = req.url;
      return (
        url.startsWith('/api/v1/api-docs') ||
        url.startsWith('/api-json') ||
        url.includes('swagger')
      );
    },
    keyGenerator: (req: FastifyRequest) => {
      // IP + URL pattern → buckets distincts par endpoint sensible.
      // Sans ça, "5/min sur /signin" partagerait son compteur avec "5/min sur /finalize".
      const ip = (req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown').toString();
      const matched = STRICT_ROUTES.find((r) => r.pattern.test(req.url));
      return matched ? `${ip}::${matched.pattern.source}` : `${ip}::default`;
    },
    max: (req: FastifyRequest, _key: string) => {
      const matched = STRICT_ROUTES.find((r) => r.pattern.test(req.url));
      return matched ? matched.max : 300;
    },
    timeWindow: (req: FastifyRequest, _key: string) => {
      const matched = STRICT_ROUTES.find((r) => r.pattern.test(req.url));
      return matched ? matched.windowMs : 60_000;
    },
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: !isProd,
      transform: true,
      stopAtFirstError: isProd,
    }),
  );

  // ---- Hooks Fastify ----
  const fastify = app.getHttpAdapter().getInstance();

  fastify.addHook(
    'onRequest',
    async (req: RequestWithMeta, reply: FastifyReply) => {
      req.rid = (req.headers['x-request-id'] as string) || randomUUID();
      reply.header('X-Request-Id', req.rid);
      req.start = process.hrtime.bigint();
    },
  );

  fastify.addHook(
    'onSend',
    async (req: RequestWithMeta, reply: FastifyReply, payload: unknown) => {
      const start = req.start;
      if (start) {
        const ns = Number(process.hrtime.bigint() - start);
        const ms = (ns / 1e6).toFixed(2);
        reply.header('X-Response-Time', `${ms}ms`);
      }
      return payload;
    },
  );

  fastify.addHook(
    'onResponse',
    async (req: RequestWithMeta, reply: FastifyReply) => {
      const rid = req.rid;
      const start = req.start;
      const ns = start ? Number(process.hrtime.bigint() - start) : 0;
      const ms = ns ? (ns / 1e6).toFixed(2) : '0.00';
      fastify.log.info(
        {
          rid,
          method: req.method,
          url: req.url,
          statusCode: reply.statusCode,
          durationMs: ms,
        },
        'HTTP Request',
      );
    },
  );
  // -----------------------

  // Swagger en dev
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('API Documentation')
      .setDescription('NestJS + Prisma (JWT, etc.)')
      .setVersion('1.0')
      // le nom 'access-token' sera utilisé dans le requirement global ci-dessous
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      deepScanRoutes: true,
    });

    // 🔒 OPTION 2 : requirement Bearer global sur toutes les routes
    // (si tu veux exclure /auth/*, dé-commente l'if conditionnel)
    const paths = document.paths as Record<
      string,
      Record<string, OpenApiOperation>
    >;
    for (const path of Object.keys(paths)) {
      const pathItem = paths[path];
      for (const method of Object.keys(pathItem)) {
        const op = pathItem[method];
        // if (!path.startsWith('/api/v1/auth')) { // <- exclure les routes d'auth si besoin
        op.security = [{ 'access-token': [] }];
        // }
      }
    }

    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // Shutdown hooks
  app.enableShutdownHooks();

  // Endpoint de santé
  fastify.get('/api/v1/health', async (_req, reply) =>
    reply.code(200).send({ status: 'ok', ts: new Date().toISOString() }),
  );

  await app.listen({ port, host: '0.0.0.0' });

  // 🔎 Log des URLs complètes (localhost + IPs LAN) pour server, swagger, health
  const ifaces = os.networkInterfaces();
  const addrs: string[] = [];
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (net.family === 'IPv4') addrs.push(net.address);
    }
  }
  addrs.forEach((addr) => {
    const base = `http://${addr}:${port}`;
    fastify.log.info(`Server listening at ${base}`);
    fastify.log.info(`    Swagger: ${base}/api-docs`);
    fastify.log.info(`    Health:  ${base}/api/v1/health`);
  });

  fastify.log.info(`Logs file: ${logFilePath}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
