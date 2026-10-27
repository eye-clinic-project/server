import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { randomInt } from 'node:crypto';
import { Socket } from 'socket.io';
@Injectable()
export class UtilService {
  constructor() {}
  public toObjectId = (id: string) => {
    return Types.ObjectId.createFromHexString(id);
  };
  public createNumberOtp = (): number => {
    return randomInt(100_000, 1_000_000);
  };
  public generateSlug = (value: string) => {
    return value.replaceAll(/\s+/g, '-');
  };
  public getAuthSocket = (client: Socket) => {
    return (
      client.handshake.auth.authorization ||
      client.handshake.headers.authorization
    );
  };
}
