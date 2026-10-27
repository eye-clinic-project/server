import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import {
  AuthProviderEnum,
  UserRoleEnum,
} from '../../common/enum/security.enum.js';
import { RedisKeys, CacheService } from '../../common/service/cache.service.js';
import { MailService } from '../../common/service/mail.service.js';
import { SecurityService } from '../../common/service/security.service.js';
import { TokenService } from '../../common/service/token.service.js';
import { UtilService } from '../../common/service/util.service.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';
import { CreateAuthenticationDto } from './dto/create-authentication.dto.js';
import { EmailDto, VerifyEmailDto } from './dto/email.dto.js';
import { GoogleCredentialDto } from './dto/google-credential.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { LogoutTypeEnum } from '../../common/enum/security.enum.js';

interface GoogleTokenClaims {
  aud?: unknown;
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
  sub?: unknown;
}

function isDuplicateKeyError(error: unknown): error is { code: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 11000
  );
}

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly users: UserRepository,
    private readonly security: SecurityService,
    private readonly tokens: TokenService,
    private readonly cache: CacheService,
    private readonly util: UtilService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async signUp(
    { name, email, password, city }: CreateAuthenticationDto,
  ): Promise<{ email: string; emailVerificationRequired: true }> {
    if (await this.users.findByEmailWithoutPassword(email)) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.security.hash(password);
    try {
      const user = await this.users.createAuthUser({
          name: name.trim(),
          email,
          passwordHash,
          city: city.trim(),
          role: UserRoleEnum.PATIENT,
          provider: AuthProviderEnum.SYSTEM,
          emailVerifiedAt: null,
      });

      return { email: user.email, emailVerificationRequired: true };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw error;
    }
  }

  async login(
    { email, password }: LoginDto,
    issuer: string,
    clientAddress: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.users.findByEmail(email);

    if (
      user?.provider === AuthProviderEnum.GOOGLE ||
      !user?.passwordHash ||
      !(await this.security.compare(password, user.passwordHash))
    ) {
      const attempts = await this.cache.incrementCache({
        key: RedisKeys.rateLimitKey('login', `${clientAddress}:${email}`),
        ttl: 900,
      });
      if (attempts > 5) {
        throw new HttpException(
          'Too many failed sign-in attempts. Try again in 15 minutes.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.emailVerifiedAt) {
      throw new ConflictException('Email address is not verified');
    }

    await this.cache.deleteCache({
      key: RedisKeys.rateLimitKey('login', `${clientAddress}:${email}`),
    });

    const credentials = await this.tokens.createLoginCredentials(user, issuer);
    return {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token,
    };
  }

  async googleCredential(
    { idToken, city }: GoogleCredentialDto,
    issuer: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    statusCode: 200 | 201;
  }> {
    const claims = await this.verifyGoogleCredential(idToken);
    const email = claims.email.toLowerCase();
    const existing = await this.users.findByEmailWithoutPassword(email);

    if (existing) {
      if (
        existing.provider !== AuthProviderEnum.GOOGLE ||
        existing.googleId !== claims.sub
      ) {
        throw new ConflictException(
          'This email is already registered with another sign-in method',
        );
      }

      const credentials = await this.tokens.createLoginCredentials(
        existing,
        issuer,
      );
      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token,
        statusCode: 200,
      };
    }

    try {
      const user = await this.users.createAuthUser({
          name:
            typeof claims.name === 'string' && claims.name.trim()
              ? claims.name.trim()
              : email.split('@')[0],
          email,
          city: city.trim(),
          role: UserRoleEnum.PATIENT,
          provider: AuthProviderEnum.GOOGLE,
          googleId: claims.sub,
          emailVerifiedAt: new Date(),
      });
      const credentials = await this.tokens.createLoginCredentials(user, issuer);
      return {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token,
        statusCode: 201,
      };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException(
          'An account with this email or Google account already exists',
        );
      }
      throw error;
    }
  }

  async sendVerificationEmail({ email }: EmailDto): Promise<{ sent: true }> {
    const user = await this.users.findByEmailWithoutPassword(email);
    if (!user) {
      throw new NotFoundException('Account not found');
    }
    if (user.emailVerifiedAt) {
      throw new ConflictException('Email address is already verified');
    }

    const code = this.util.createNumberOtp();
    const key = RedisKeys.emailVerification(email);
    const hashedCode = await this.security.hash(String(code));

    await this.mail.sendVerificationCode(email, code);
    await this.cache.setCache({
      key,
      value: hashedCode,
      options: { EX: 120 },
    });

    return { sent: true };
  }

  async verifyEmail({ email, otp }: VerifyEmailDto): Promise<{ verified: true }> {
    const user = await this.users.findByEmailWithoutPassword(email);
    if (!user) {
      throw new NotFoundException('Account not found');
    }
    if (user.emailVerifiedAt) {
      throw new ConflictException('Email address is already verified');
    }

    const hashedCode = await this.cache.getCache<string>({
      key: RedisKeys.emailVerification(email),
    });
    if (!hashedCode || !(await this.security.compare(otp, hashedCode))) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const update = await this.users.updateOne({
      filter: { _id: user._id, emailVerifiedAt: null },
      update: { $set: { emailVerifiedAt: new Date() } },
    });
    if (update.modifiedCount !== 1) {
      throw new ConflictException('Email address is already verified');
    }

    await this.cache.deleteCache({
      key: RedisKeys.emailVerification(email),
    });
    return { verified: true };
  }

  async rotateToken(
    token: string,
    issuer: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const credentials = await this.tokens.rotateRefreshToken({ token, issuer });
    return {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token,
    };
  }

  async logout(
    userId: Types.ObjectId,
    tokenId: string,
    action: LogoutTypeEnum,
  ): Promise<{ revoked: number }> {
    const revoked =
      action === LogoutTypeEnum.ALL
        ? await this.tokens.logout(userId)
        : await this.tokens.revokeToken(userId, tokenId);
    return { revoked };
  }

  private async verifyGoogleCredential(
    idToken: string,
  ): Promise<{ email: string; name?: string; sub: string }> {
    const clientId = this.config.get<string>('google.clientId');
    if (!clientId) {
      throw new ServiceUnavailableException(
        'Google sign-in is not configured',
      );
    }

    const endpoint = new URL('https://oauth2.googleapis.com/tokeninfo');
    endpoint.searchParams.set('id_token', idToken);

    let response: Response;
    try {
      response = await fetch(endpoint, { signal: AbortSignal.timeout(5_000) });
    } catch (error) {
      throw new ServiceUnavailableException(
        'Google credential verification is unavailable',
        { cause: error },
      );
    }

    if (!response.ok) {
      throw new UnauthorizedException('Invalid Google credential');
    }

    const claims: unknown = await response.json();
    if (
      typeof claims !== 'object' ||
      claims === null ||
      !('aud' in claims) ||
      !('email' in claims) ||
      !('email_verified' in claims) ||
      !('sub' in claims)
    ) {
      throw new UnauthorizedException('Invalid Google credential');
    }

    const googleClaims = claims as GoogleTokenClaims;
    if (
      googleClaims.aud !== clientId ||
      typeof googleClaims.email !== 'string' ||
      !googleClaims.email.trim() ||
      (googleClaims.email_verified !== true &&
        googleClaims.email_verified !== 'true') ||
      typeof googleClaims.sub !== 'string' ||
      !googleClaims.sub
    ) {
      throw new UnauthorizedException('Invalid Google credential');
    }

    return {
      email: googleClaims.email.trim().toLowerCase(),
      sub: googleClaims.sub,
      ...(typeof googleClaims.name === 'string'
        ? { name: googleClaims.name }
        : {}),
    };
  }
}
