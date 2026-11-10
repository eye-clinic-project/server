import { BadRequestException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { randomInt } from 'node:crypto';
import { Socket } from 'socket.io';
import { IAuthReq } from '../interface/ctx.interface.js';
import { ConfigService } from '@nestjs/config';

/** Escapes user input before using it inside a MongoDB $regex. */
export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const MRN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

@Injectable()
export class UtilService {
  constructor(private readonly configService: ConfigService) {}

  toObjectId = (id: string) => Types.ObjectId.createFromHexString(id);
  generateSlug = (value: string) => value.replaceAll(/\s+/g, '-');
  createNumberOtp = (): number => randomInt(100_000, 1_000_000);
  createMedicalRecordNumber = (): string => {
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += MRN_ALPHABET[randomInt(0, MRN_ALPHABET.length)];
    }
    return `P-${id}`;
  };
  getAuthSocket = (client: Socket): string | undefined => {
    const auth = client.handshake.auth as Record<string, unknown> | undefined;
    const fromAuth = auth?.authorization ?? auth?.token;
    return (typeof fromAuth === 'string' ? fromAuth : undefined) || client.handshake.headers.authorization;
  };

  frontendUrl(path = ''): string {
    const base = this.configService.get<string>('app.frontendUrl', 'http://localhost:3000').replace(/\/$/, '');
    return `${base}${path}`;
  }
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
