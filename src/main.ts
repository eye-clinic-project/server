import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
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
      }),
    );

    app.enableCors({
      origin: config.get<string>('app.corsOrigin', 'http://localhost:3000'),
      credentials: true,
    });
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
      prefix: '/uploads/',
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
