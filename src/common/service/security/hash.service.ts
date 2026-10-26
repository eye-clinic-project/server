
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class HashingService {
  private readonly saltRounds = 12;

  async hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.saltRounds);
  }

  async compare(
    value: string,
    hashedValue: string,
  ): Promise<boolean> {
    return bcrypt.compare(value, hashedValue);
  }
}
