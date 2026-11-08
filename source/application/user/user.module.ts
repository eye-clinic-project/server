import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import type { Request, Response, NextFunction } from 'express';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply().forRoutes(UserController);
  }
}

export const logger = (req: Request, res: Response, next: NextFunction) => {
  next();
};
