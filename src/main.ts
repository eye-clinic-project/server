import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { NestExpressApplication } from '@nestjs/platform-express';
import { logger } from './module/user/user.module.js';
import { AllExceptionsFilter } from './dependency/exception/all-exceptions.filter.js';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.set('query parser', 'extended');
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter))
  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
