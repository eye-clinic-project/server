import { ThrottlerGuard } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { I18nValidationPipe } from '@nestjs/i18n';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import type { NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './dependencies/exception/all-exceptions.filter.js';
import { LoggingInterceptor } from './dependencies/interceptor/logging.interceptor.js';
import { TimeoutInterceptor } from './dependencies/interceptor/timeout.interceptor.js';
import { TransformInterceptor } from './dependencies/interceptor/transform.interceptor.js';
import { DevPrint } from './dependencies/middleware/dev-print.middleware.js';
import { MaintenanceMiddleware } from './dependencies/middleware/maintenance-mode.middleware.js';
import { SlowRequestMiddleware } from './dependencies/middleware/response-time.middleware.js';

const SWAGGER_FILE = join(process.cwd(), 'public', 'documentation', 'swagger.json');

async function setupSwagger(app: NestExpressApplication) {
  const document = JSON.parse(await readFile(SWAGGER_FILE, 'utf8')) as OpenAPIObject;
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs/json',
    swaggerOptions: { persistAuthorization: true },
  });
}

const middleware = (instance: NestMiddleware<Request, Response>) => (req: Request, res: Response, next: NextFunction) => instance.use(req, res, next);

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });

  const config = app.get(ConfigService);
  const production = config.get<string>('app.environment') === 'production';
  const origins = config.get<string[]>('app.corsOrigins', []);
  const bodyLimit = config.get<string>('app.bodyLimit', '1mb');

  app.set('trust proxy', config.get('app.trustProxy'));
  app.disable('x-powered-by');
  app.enableShutdownHooks();
  app.useBodyParser('json', { limit: bodyLimit });
  app.useBodyParser('urlencoded', { limit: bodyLimit, extended: true });
  app.enableCors({
    origin: origins.length ? origins : !production,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept', 'Accept-Language', 'X-Language'],
    exposedHeaders: ['Content-Disposition', 'Retry-After'],
    maxAge: 600,
  });
  app.useSecurityHeaders();
  app.enableCsrfProtection({ trustedOrigins: origins });
  app.use(middleware(new MaintenanceMiddleware(config)));
  app.use(middleware(new SlowRequestMiddleware()));
  app.useGlobalGuards(app.get(ThrottlerGuard));
  app.useGlobalInterceptors(/*new LoggingInterceptor(), */ new TransformInterceptor(), new TimeoutInterceptor());
  app.useGlobalPipes(new I18nValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost).httpAdapter));

  // if (!production) app.use(middleware(new DevPrint()));
  if (!production) await setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
