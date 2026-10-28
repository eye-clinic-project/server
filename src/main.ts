import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { I18nContext } from 'nestjs-i18n';
import type { ValidationError } from 'class-validator';
import { formatValidationErrors } from './common/gql/validate-graphql-input.js';
import { join } from 'node:path';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { LoggerService } from './common/service/logger.service.js';

class Server {
  public async run() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: new LoggerService(),
    });
    const config = app.get(ConfigService);
    const logger = app.get(LoggerService);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors: ValidationError[]) => {
          const i18n = I18nContext.current();
          return new BadRequestException({
            statusCode: 400,
            message:
              i18n?.translate('validation.invalid') ?? 'Validation failed',
            errors: formatValidationErrors(errors),
          });
        },
      }),
    );

    app.enableCors({
      origin: config.get<string>('app.corsOrigin', 'http://localhost:3000'),
      credentials: true,
    });

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Diabetic Retinopathy Detection API')
      .setDescription(
        'REST API for authentication, patient and doctor profiles, appointments, analyses, reports, chat, and notifications.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'bearerAuth',
      )
      .build();
    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDocument, {
      jsonDocumentUrl: 'api/docs-json',
    });

    app.useStaticAssets(join(process.cwd(), 'assets'), {
      prefix: '/assets/',
    });

    app.enableShutdownHooks();

    const port = config.get<number>('app.port', 3000);
    await app.listen(port);
    logger.log(`Server running on ${await app.getUrl()}`);
  }
}

const server = new Server();
void server.run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
