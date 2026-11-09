import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Types } from 'mongoose';

/** Validates a route param as a MongoDB ObjectId and converts it. */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, Types.ObjectId> {
  transform(value: string): Types.ObjectId {
    if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) {
      throw new BadRequestException('Invalid id');
    }
    return new Types.ObjectId(value);
  }
}
