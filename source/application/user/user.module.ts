import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import type { Request, Response, NextFunction } from 'express';
import { MongooseModule } from '@nestjs/mongoose';
import { DevPrint } from '../../dependency/middleware/dev-print.js';

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DevPrint).forRoutes(UserController);
  }
}
