import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './module/auth/auth.module.js';
import { UserModule } from './module/user/user.module.js';
import { assignToObject } from '@nestjs/core/repl/assign-to-object.util.js';
import { appendFile } from 'fs';


@Module({
  imports: [
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply()
      .forRoutes();
  }
}


