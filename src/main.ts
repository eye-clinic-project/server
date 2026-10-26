import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { LoggerService } from './common/service/log/logger.service.js';

class Server {
  public async run() {
    const app = await NestFactory.create(AppModule, {
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
      origin: config.get<string>(
        'app.corsOrigin',
        'http://localhost:3000',
      ),
      credentials: true,
    });

    app.enableShutdownHooks();

    const port = config.get<number>('app.port', 3000);
    await app.listen(port);
    logger.log(`Server running on ${await app.getUrl()}`);
  }
}

const server = new Server();
server.run();