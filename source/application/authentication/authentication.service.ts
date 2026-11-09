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
import { createHash, randomBytes } from 'node:crypto';
import { UserRepository } from '../../database/repository/user.repository.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SecurityService } from '../../dependency/service/security.service.js';
import { TokenService } from '../../dependency/service/token.service.js';
import {
  CacheService,
  RedisKeys,
} from '../../dependency/service/cache.service.js';
import { UtilService } from '../../dependency/service/util.service.js';
import { MailService } from '../../dependency/service/mail.service.js';
import { LoginDto } from './dto/login.dto.js';
import {
  AuthProviderEnum,
  LogoutTypeEnum,
  SystemRoleEnum,
} from '../../dependency/enum/security.enum.js';
import { SignUpDto } from './dto/signup.dto.js';
import { GoogleCredentialDto } from './dto/google-credential.dto.js';
import { EmailDto, VerifyEmailDto } from './dto/email.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { GoogleTokenClaims } from '../../dependency/interface/security.interface.js';

const PASSWORD_RESET_TTL_SECONDS = 10 * 60;

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
    private readonly userRepository: UserRepository,
    private readonly security: SecurityService,
    private readonly tokens: TokenService,
    private readonly cache: CacheService,
    private readonly util: UtilService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async signUp({name,email,password,city,}: SignUpDto): Promise<{email: string;emailVerificationRequired: true;}> {
    if (await this.userRepository.findByEmailWithoutPassword(email)) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.security.hash(password);
    try {
      const user = await this.userRepository.createAuthUser({
        name: name.trim(),
        email,
        passwordHash,
        city: city.trim(),
        role: SystemRoleEnum.PATIENT,
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
    ip: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(email);

    if (
      user?.provider === AuthProviderEnum.GOOGLE ||
      !user?.passwordHash ||
      !(await this.security.compare(password, user.passwordHash))
    ) {
      throw new ConflictException("invalid login credential")
    }

    if (!user.emailVerifiedAt) {
      throw new ConflictException('Email address is not verified');
    }

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
    const existing = await this.userRepository.findByEmailWithoutPassword(email);

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
      const user = await this.userRepository.createAuthUser({
        name:
          typeof claims.name === 'string' && claims.name.trim()
            ? claims.name.trim()
            : email.split('@')[0],
        email,
        city: city.trim(),
        role: SystemRoleEnum.PATIENT,
        provider: AuthProviderEnum.GOOGLE,
        googleId: claims.sub,
        emailVerifiedAt: new Date(),
      });
      const credentials = await this.tokens.createLoginCredentials(
        user,
        issuer,
      );
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
    const user = await this.userRepository.findByEmailWithoutPassword(email);
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

  async verifyEmail({
    email,
    otp,
  }: VerifyEmailDto): Promise<{ verified: true }> {
    const user = await this.userRepository.findByEmailWithoutPassword(email);
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

    const update = await this.userRepository.updateOne({
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

  async forgotPassword({
    email,
  }: ForgotPasswordDto): Promise<{ sent: true }> {
    const user = await this.userRepository.findByEmail(email);
    if (
      !user ||
      user.provider !== AuthProviderEnum.SYSTEM ||
      !user.passwordHash
    ) {
      return { sent: true };
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const key = RedisKeys.passwordReset(tokenHash);

    await this.cache.setCache({
      key,
      value: user._id.toString(),
      options: { EX: PASSWORD_RESET_TTL_SECONDS },
    });

    try {
      await this.mail.sendPasswordResetToken(email, token);
    } catch (error) {
      await this.cache.deleteCache({ key });
      throw error;
    }

    return { sent: true };
  }

  async resetPassword({
    token,
    password,
  }: ResetPasswordDto): Promise<{ reset: true }> {
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const userId = await this.cache.getAndDelete<string>({
      key: RedisKeys.passwordReset(tokenHash),
    });
    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const user = await this.userRepository.findHydratedById(
      new Types.ObjectId(userId),
    );
    if (!user || user.provider !== AuthProviderEnum.SYSTEM) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const passwordHash = await this.security.hash(password);
    const update = await this.userRepository.updateOne({
      filter: { _id: user._id },
      update: { $set: { passwordHash } },
    });
    if (update.modifiedCount !== 1) {
      throw new NotFoundException('Account not found');
    }

    await this.tokens.logout(user._id);
    return { reset: true };
  }

  async changePassword(
    user: HUserDocument,
    { currentPassword, newPassword }: ChangePasswordDto,
  ): Promise<{ changed: true }> {
    const account = await this.userRepository.findByEmail(user.email);
    if (
      !account ||
      account.provider !== AuthProviderEnum.SYSTEM ||
      !account.passwordHash
    ) {
      throw new BadRequestException(
        'Password changes are unavailable for this sign-in method',
      );
    }
    if (
      !(await this.security.compare(currentPassword, account.passwordHash))
    ) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await this.security.hash(newPassword);
    const update = await this.userRepository.updateOne({
      filter: { _id: account._id, passwordHash: account.passwordHash },
      update: { $set: { passwordHash } },
    });
    if (update.modifiedCount !== 1) {
      throw new ConflictException(
        'Password changed before this request could be completed',
      );
    }

    return { changed: true };
  }

  private async verifyGoogleCredential(
    idToken: string,
  ): Promise<{ email: string; name?: string; sub: string }> {
    const clientId = this.config.get<string>('google.clientId');
    if (!clientId) {
      throw new ServiceUnavailableException('Google sign-in is not configured');
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
