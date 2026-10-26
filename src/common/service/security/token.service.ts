import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { JwtPayload } from 'jsonwebtoken';
import { HydratedDocument, Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { UserRole } from '../../../common/enum/schema.enum.js';
import { User, UserDocument } from '../../../core/database/model/user.model.js';
import { UserRepository } from '../../../core/database/repository/user.repository.js';
import { RedisKeys } from '../redis/redis.keys.js';
import { RedisService } from '../redis/redis.service.js';

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
}

interface DecodedToken extends JwtPayload {
  sub?: string;
  aud?: string | string[];
  jti?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class TokenService {
  private readonly accessTokenExpiresIn: number;
  private readonly refreshTokenExpiresIn: number;
  private readonly accessUserTokenSignature: string;
  private readonly refreshUserTokenSignature: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
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
  }): Promise<DecodedToken> {
    return this.jwtService.verifyAsync<DecodedToken>(token, { secret });
  }

  getSignature(
    tokenType: TokenType,
    _role: UserRole,
  ): string {
    return tokenType === TokenType.REFRESH
      ? this.refreshUserTokenSignature
      : this.accessUserTokenSignature;
  }

  async decodeToken({
    token,
    tokenType = TokenType.ACCESS,
  }: {
    token: string;
    tokenType?: TokenType;
  }): Promise<{ user: UserDocument; decoded: DecodedToken }> {
    const rawDecoded = this.jwtService.decode(token);
    if (!rawDecoded || typeof rawDecoded !== 'object') {
      throw new BadRequestException('Invalid token payload');
    }

    const decoded = rawDecoded as DecodedToken;
    if (!Array.isArray(decoded.aud) || decoded.aud.length !== 2) {
      throw new BadRequestException('Invalid token audience');
    }

    const [claimedTokenType, claimedRole] = decoded.aud;
    if (claimedTokenType !== tokenType) {
      throw new BadRequestException(
        `Invalid token type. Only ${tokenType} is allowed`,
      );
    }
    if (!Object.values(UserRole).includes(claimedRole as UserRole)) {
      throw new BadRequestException('Invalid token role');
    }

    const verifiedData = await this.verify({
      token,
      secret: this.getSignature(tokenType, claimedRole as UserRole),
    });

    if (!verifiedData.sub || !Types.ObjectId.isValid(verifiedData.sub)) {
      throw new BadRequestException('Invalid token subject');
    }
    if (!verifiedData.jti || verifiedData.iat === undefined) {
      throw new BadRequestException('Invalid token claims');
    }

    const revoked = await this.redis.getCache<string>({
      key: RedisKeys.tokenRevocation(verifiedData.sub, verifiedData.jti),
    });
    if (revoked) {
      throw new UnauthorizedException('Invalid login session');
    }

    const user = await this.userRepository.findOne({
      filter: { _id: verifiedData.sub },
    });
    if (!user) {
      throw new NotFoundException('Account not found');
    }

    if (
      user.changeCredentialsTime &&
      user.changeCredentialsTime.getTime() >= verifiedData.iat * 1000
    ) {
      throw new UnauthorizedException('Invalid login session');
    }
    if (user.role !== claimedRole) {
      throw new UnauthorizedException('Invalid login session');
    }

    return { user, decoded: verifiedData };
  }

  async createLoginCredentials(
    user: HydratedDocument<User>,
    issuer: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const subject = user._id.toString();
    const commonOptions = {
      issuer,
      audience: [TokenType.ACCESS, user.role],
    };

    const [access_token, refresh_token] = await Promise.all([
      this.sign({
        payload: { sub: subject },
        secret: this.accessUserTokenSignature,
        options: {
          ...commonOptions,
          expiresIn: this.accessTokenExpiresIn,
          jwtid: randomUUID(),
        },
      }),
      this.sign({
        payload: { sub: subject },
        secret: this.refreshUserTokenSignature,
        options: {
          ...commonOptions,
          audience: [TokenType.REFRESH, user.role],
          expiresIn: this.refreshTokenExpiresIn,
          jwtid: randomUUID(),
        },
      }),
    ]);

    return { access_token, refresh_token };
  }

  async createRevokeToken({
    userId,
    jti,
    ttl,
  }: {
    userId: Types.ObjectId | string;
    jti: string;
    ttl: number;
  }): Promise<void> {
    if (!Number.isFinite(ttl) || ttl <= 0) {
      return;
    }

    await this.redis.setCache({
      key: RedisKeys.tokenRevocation(userId.toString(), jti),
      value: 'revoked',
      options: { EX: Math.ceil(ttl) },
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
      tokenType: TokenType.REFRESH,
    });

    if (!decoded.jti || !decoded.exp || !decoded.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl <= 0) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const claimed = await this.redis.setCache({
      key: RedisKeys.tokenRevocation(decoded.sub, decoded.jti),
      value: 'rotated',
      options: { EX: ttl, NX: true },
    });
    if (!claimed) {
      throw new UnauthorizedException(
        'Refresh token already used or revoked',
      );
    }

    return this.createLoginCredentials(user, issuer);
  }
}
