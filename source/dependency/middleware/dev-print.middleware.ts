import {
  Injectable,
  NestMiddleware,
} from '@nestjs/common';

import type {
  Request,
  Response,
  NextFunction,
} from 'express';

@Injectable()
export class DevPrint implements NestMiddleware {
  use(req: Request,res: Response,next: NextFunction) {
    console.log({
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      date: new Date(),
    });
    next();
  }
}
