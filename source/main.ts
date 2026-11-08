import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './dependency/exception/all-exceptions.filter.js';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
class Server {
  constructor() {}
  async bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.set('query parser', 'extended','trust proxy', 'loopback');
    const configuration = app.get(ConfigService);

    const swaggerConfig = new DocumentBuilder()
      .setTitle('DR Detection API')
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
    const port = configuration.getOrThrow<number>('app.port');
    app.useStaticAssets(join(process.cwd(), 'assets'), { prefix: '/assets/' });
    app.useGlobalPipes(new ValidationPipe());
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
    await app.listen(port ?? 3000);
  }
}

const server = new Server();
await server.bootstrap();
