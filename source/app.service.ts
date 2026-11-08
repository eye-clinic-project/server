import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): object {
    return { message: 'hello from backend side' };
  }
}
