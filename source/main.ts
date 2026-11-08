import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './dependency/exception/all-exceptions.filter.js';

class Server {
  constructor() {}
  async bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.set('query parser', 'extended');
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
    await app.listen(process.env.PORT ?? 3000);
  }
}

const server = new Server();
await server.bootstrap();
