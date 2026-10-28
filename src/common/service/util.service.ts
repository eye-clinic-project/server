import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { randomInt } from 'node:crypto';
import { Socket } from 'socket.io';
import { IAuthReq } from '../interface/ctx.interface.js';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class UtilService {
  constructor(
    private readonly configService : ConfigService
  ) { }

  toObjectId = (id: string) => {
    return Types.ObjectId.createFromHexString(id);
  };
  createNumberOtp = (): number => {
    return randomInt(100_000, 1_000_000);
  };
  generateSlug = (value: string) => {
    return value.replaceAll(/\s+/g, '-');
  };
  getAuthSocket = (client: Socket) => {
    return (
      client.handshake.auth.authorization ||
      client.handshake.headers.authorization
    );
  };
  issuer(request: IAuthReq): string {
    const configuredIssuer = this.configService.get<string>('auth.issuer');
    if (configuredIssuer) {
      return configuredIssuer;
    }

    const host = request.get('host');
    if (!host) {
      throw new BadRequestException('Could not determine token issuer');
    }
    return `${request.protocol}://${host}`;
  }
}
