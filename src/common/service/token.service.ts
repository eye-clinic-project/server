import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';

import type {
  HUserDocument,
  User,
} from '../../core/database/model/user.model.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';

import { RedisKeys, CacheService } from './cache.service.js';

import { TokenEnum, UserRoleEnum } from '../enum/security.enum.js';

import { UtilService } from './util.service.js';
import { JwtPayload } from 'jsonwebtoken';
import { IAuthReq } from '../interface/ctx.interface.js';

@Injectable()
export class TokenService {
  private readonly accessTokenExpiresIn: number;
  private readonly refreshTokenExpiresIn: number;
  private readonly accessUserTokenSignature: string;
  private readonly refreshUserTokenSignature: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: CacheService,
    private readonly utilService: UtilService,
    private readonly userRepository: UserRepository,
  ) {
    this.accessTokenExpiresIn = Number(
      this.configService.getOrThrow<string>('ACCESS_TOKEN_EXPIRES_IN'),
    );
    this.refreshTokenExpiresIn = Number(
      this.configService.getOrThrow<string>('REFRESH_TOKEN_EXPIRES_IN'),
    );
    this.accessUserTokenSignature = this.configService.getOrThrow<string>(
      'ACCESS_USER_TOKEN_SIGNATURE',
    );
    this.refreshUserTokenSignature = this.configService.getOrThrow<string>(
      'REFRESH_USER_TOKEN_SIGNATURE',
    );

    if (
      !Number.isSafeInteger(this.accessTokenExpiresIn) ||
      this.accessTokenExpiresIn <= 0 ||
      !Number.isSafeInteger(this.refreshTokenExpiresIn) ||
      this.refreshTokenExpiresIn <= 0
    ) {
      throw new Error('Token expirations must be positive integer seconds');
    }
  }

  getBearerToken(request: IAuthReq): string {
    const authorization = request.headers.authorization;
    const [scheme, token, ...extra] = authorization?.trim().split(/\s+/) ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !token || extra.length > 0) {
      throw new UnauthorizedException('Invalid authorization format');
    }
    return token;
  }

  async sign({
    payload,
    secret = this.accessUserTokenSignature,
    options,
  }: {
    payload: object;
    secret?: string;
    options?: JwtSignOptions;
  }): Promise<string> {
    return this.jwtService.signAsync(payload, { ...options, secret });
  }

  async verify({
    token,
    secret = this.accessUserTokenSignature,
  }: {
    token: string;
    secret?: string;
  }): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, { secret });
  }

  getSignature(tokenType: TokenEnum, _role: UserRoleEnum): string {
    return tokenType === TokenEnum.REFRESH
      ? this.refreshUserTokenSignature
      : this.accessUserTokenSignature;
  }

  async decodeToken({
    token,
    tokenType = TokenEnum.ACCESS,
  }: {
    token: string;
    tokenType?: TokenEnum;
  }): Promise<{ user: HUserDocument; decoded: JwtPayload }> {
    const rawDecoded = this.jwtService.decode(token);
    if (!rawDecoded || typeof rawDecoded !== 'object') {
      throw new BadRequestException('Invalid token payload');
    }

    const decoded = rawDecoded as JwtPayload;
    if (!Array.isArray(decoded.aud) || decoded.aud.length !== 2) {
      throw new BadRequestException('Invalid token audience');
    }

    const [claimedTokenType, claimedRole] = decoded.aud;
    if (claimedTokenType !== tokenType) {
      throw new BadRequestException(
        `Invalid token type. Only ${tokenType} is allowed`,
      );
    }
    if (!Object.values(UserRoleEnum).includes(claimedRole as UserRoleEnum)) {
      throw new BadRequestException('Invalid token role');
    }

    const verifiedData = await this.verify({
      token,
      secret: this.getSignature(tokenType, claimedRole as UserRoleEnum),
    });

    if (!verifiedData.sub || !Types.ObjectId.isValid(verifiedData.sub)) {
      throw new BadRequestException('Invalid token subject');
    }
    if (!verifiedData.jti || verifiedData.iat === undefined) {
      throw new BadRequestException('Invalid token claims');
    }

    const activeTokenType = await this.redis.getCache<TokenEnum>({
      key: RedisKeys.userToken(verifiedData.sub, verifiedData.jti),
    });
    if (activeTokenType !== tokenType) {
      throw new UnauthorizedException('Invalid login session');
    }

    const user = await this.userRepository.findHydratedById(
      new Types.ObjectId(verifiedData.sub),
    );

    if (!user) {
      throw new NotFoundException('Account not found');
    }

    if (user.role !== claimedRole) {
      throw new UnauthorizedException('Invalid login session');
    }

    return { user, decoded: verifiedData };
  }

  async createLoginCredentials(
    user: Pick<User, 'role'> & { _id: Types.ObjectId },
    issuer: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const subject = user._id.toString();
    const accessJti = randomUUID();
    const refreshJti = randomUUID();
    const commonOptions = {
      issuer,
      audience: [TokenEnum.ACCESS, user.role],
    };

    const [access_token, refresh_token] = await Promise.all([
      this.sign({
        payload: { sub: subject },
        secret: this.accessUserTokenSignature,
        options: {
          ...commonOptions,
          expiresIn: this.accessTokenExpiresIn,
          jwtid: accessJti,
        },
      }),
      this.sign({
        payload: { sub: subject },
        secret: this.refreshUserTokenSignature,
        options: {
          ...commonOptions,
          audience: [TokenEnum.REFRESH, user.role],
          expiresIn: this.refreshTokenExpiresIn,
          jwtid: refreshJti,
        },
      }),
    ]);

    await Promise.all([
      this.redis.setCache({
        key: RedisKeys.userToken(subject, accessJti),
        value: TokenEnum.ACCESS,
        options: { EX: this.accessTokenExpiresIn },
      }),
      this.redis.setCache({
        key: RedisKeys.userToken(subject, refreshJti),
        value: TokenEnum.REFRESH,
        options: { EX: this.refreshTokenExpiresIn },
      }),
    ]);

    return { access_token, refresh_token };
  }

  async logout(userId: Types.ObjectId | string): Promise<number> {
    return this.redis.deleteByPattern({
      pattern: RedisKeys.userTokens(userId.toString()),
    });
  }

  async revokeToken(
    userId: Types.ObjectId | string,
    tokenId: string,
  ): Promise<number> {
    return this.redis.deleteCache({
      key: RedisKeys.userToken(userId.toString(), tokenId),
    });
  }

  async rotateRefreshToken({
    token,
    issuer,
  }: {
    token: string;
    issuer: string;
  }): Promise<{ access_token: string; refresh_token: string }> {
    const { user, decoded } = await this.decodeToken({
      token,
      tokenType: TokenEnum.REFRESH,
    });

    if (!decoded.jti || !decoded.exp || !decoded.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl <= 0) {
      throw new UnauthorizedException('Refresh token expired');
    }
    if (ttl > 5 * 60) {
      throw new ConflictException(
        'Refresh token can only be renewed within 5 minutes of expiry',
      );
    }

    const activeTokenType = await this.redis.getAndDelete<TokenEnum>({
      key: RedisKeys.userToken(decoded.sub, decoded.jti),
    });
    if (activeTokenType !== TokenEnum.REFRESH) {
      throw new UnauthorizedException(
        'Refresh token already used or no longer active',
      );
    }

    return this.createLoginCredentials(user, issuer);
  }
}
