import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthenticationService } from './authentication.service.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';
import { SecurityService } from '../../common/service/security.service.js';
import { TokenService } from '../../common/service/token.service.js';
import { CacheService, RedisKeys } from '../../common/service/cache.service.js';
import { UtilService } from '../../common/service/util.service.js';
import { MailService } from '../../common/service/mail.service.js';
import { AuthProviderEnum, LogoutTypeEnum } from '../../common/enum/security.enum.js';

describe('AuthenticationService', () => {
  let service: AuthenticationService;

  const users = {
    findByEmailWithoutPassword: vi.fn(),
    findByEmail: vi.fn(),
    createAuthUser: vi.fn(),
    updateOne: vi.fn(),
  };
  const security = {
    hash: vi.fn(),
    compare: vi.fn(),
  };
  const tokens = {
    createLoginCredentials: vi.fn(),
    rotateRefreshToken: vi.fn(),
    logout: vi.fn(),
    revokeToken: vi.fn(),
  };
  const cache = {
    incrementCache: vi.fn(),
    deleteCache: vi.fn(),
    setCache: vi.fn(),
    getCache: vi.fn(),
  };
  const util = { createNumberOtp: vi.fn() };
  const mail = { sendVerificationCode: vi.fn() };
  const config = { get: vi.fn() };

  const validUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Ahmed',
    provider: AuthProviderEnum.SYSTEM,
    passwordHash: 'hashed-password',
    emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const credentials = {
    access_token: 'access-token',
    refresh_token: 'refresh-token',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: UserRepository, useValue: users },
        { provide: SecurityService, useValue: security },
        { provide: TokenService, useValue: tokens },
        { provide: CacheService, useValue: cache },
        { provide: UtilService, useValue: util },
        { provide: MailService, useValue: mail },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get(AuthenticationService);
    config.get.mockReturnValue('google-client-id');
    util.createNumberOtp.mockReturnValue(123456);
    cache.incrementCache.mockResolvedValue(1);
    cache.deleteCache.mockResolvedValue(undefined);
    cache.setCache.mockResolvedValue(undefined);
    mail.sendVerificationCode.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('signUp', () => {
    const dto = {
      name: ' Ahmed ',
      email: 'test@example.com',
      password: 'Password123!',
      city: ' Cairo ',
    };

    it('creates a patient account and returns verification requirement', async () => {
      users.findByEmailWithoutPassword.mockResolvedValue(null);
      security.hash.mockResolvedValue('hashed-password');
      users.createAuthUser.mockResolvedValue({ email: dto.email });

      await expect(service.signUp(dto)).resolves.toEqual({
        email: dto.email,
        emailVerificationRequired: true,
      });

      expect(security.hash).toHaveBeenCalledWith(dto.password);
      expect(users.createAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ahmed',
          email: dto.email,
          passwordHash: 'hashed-password',
          city: 'Cairo',
          emailVerifiedAt: null,
        }),
      );
    });

    it('rejects an email that already exists', async () => {
      users.findByEmailWithoutPassword.mockResolvedValue({ email: dto.email });

      await expect(service.signUp(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(users.createAuthUser).not.toHaveBeenCalled();
    });

    it('converts Mongo duplicate-key errors to ConflictException', async () => {
      users.findByEmailWithoutPassword.mockResolvedValue(null);
      security.hash.mockResolvedValue('hashed-password');
      users.createAuthUser.mockRejectedValue({ code: 11000 });

      await expect(service.signUp(dto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows unexpected repository errors', async () => {
      users.findByEmailWithoutPassword.mockResolvedValue(null);
      security.hash.mockResolvedValue('hashed-password');
      users.createAuthUser.mockRejectedValue(new Error('database failed'));

      await expect(service.signUp(dto)).rejects.toThrow('database failed');
    });
  });

  describe('login', () => {
    const dto = { email: 'test@example.com', password: 'Password123!' };

    it('returns access and refresh tokens for a verified user', async () => {
      users.findByEmail.mockResolvedValue(validUser);
      security.compare.mockResolvedValue(true);
      tokens.createLoginCredentials.mockResolvedValue(credentials);

      await expect(service.login(dto, 'issuer', '127.0.0.1')).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(cache.deleteCache).toHaveBeenCalledWith({
        key: RedisKeys.rateLimitKey('login', '127.0.0.1:test@example.com'),
      });
      expect(tokens.createLoginCredentials).toHaveBeenCalledWith(validUser, 'issuer');
    });

    it('rejects invalid credentials and increments the rate limiter', async () => {
      users.findByEmail.mockResolvedValue(validUser);
      security.compare.mockResolvedValue(false);

      await expect(service.login(dto, 'issuer', '127.0.0.1'))
        .rejects.toBeInstanceOf(UnauthorizedException);

      expect(cache.incrementCache).toHaveBeenCalledWith({
        key: RedisKeys.rateLimitKey('login', '127.0.0.1:test@example.com'),
        ttl: 900,
      });
    });

    it('returns Too Many Requests after more than five failed attempts', async () => {
      users.findByEmail.mockResolvedValue(null);
      cache.incrementCache.mockResolvedValue(6);

      await expect(service.login(dto, 'issuer', '127.0.0.1'))
        .rejects.toMatchObject({ status: 429 });
    });

    it('rejects Google-only users attempting password login', async () => {
      users.findByEmail.mockResolvedValue({
        ...validUser,
        provider: AuthProviderEnum.GOOGLE,
        passwordHash: undefined,
      });

      await expect(service.login(dto, 'issuer', '127.0.0.1'))
        .rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects users whose email is not verified', async () => {
      users.findByEmail.mockResolvedValue({ ...validUser, emailVerifiedAt: null });
      security.compare.mockResolvedValue(true);

      await expect(service.login(dto, 'issuer', '127.0.0.1'))
        .rejects.toBeInstanceOf(ConflictException);
      expect(tokens.createLoginCredentials).not.toHaveBeenCalled();
    });
  });

  describe('googleCredential', () => {
    const dto = { idToken: 'google-id-token', city: 'Cairo' };

    function mockGoogleResponse(body: unknown, ok = true) {
      vi.mocked(fetch).mockResolvedValue({
        ok,
        json: async () => body,
      } as Response);
    }

    it('logs in an existing Google account', async () => {
      mockGoogleResponse({
        aud: 'google-client-id',
        email: 'TEST@example.com',
        email_verified: true,
        sub: 'google-sub',
        name: 'Test User',
      });
      const existing = {
        ...validUser,
        email: 'test@example.com',
        provider: AuthProviderEnum.GOOGLE,
        googleId: 'google-sub',
      };
      users.findByEmailWithoutPassword.mockResolvedValue(existing);
      tokens.createLoginCredentials.mockResolvedValue(credentials);

      await expect(service.googleCredential(dto, 'issuer')).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        statusCode: 200,
      });
    });

    it('creates a new account for a valid Google identity', async () => {
      mockGoogleResponse({
        aud: 'google-client-id',
        email: 'NEW@example.com',
        email_verified: 'true',
        sub: 'new-google-sub',
        name: 'New User',
      });
      users.findByEmailWithoutPassword.mockResolvedValue(null);
      users.createAuthUser.mockResolvedValue({
        ...validUser,
        email: 'new@example.com',
        provider: AuthProviderEnum.GOOGLE,
      });
      tokens.createLoginCredentials.mockResolvedValue(credentials);

      await expect(service.googleCredential(dto, 'issuer')).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        statusCode: 201,
      });

      expect(users.createAuthUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          googleId: 'new-google-sub',
          emailVerifiedAt: expect.any(Date),
        }),
      );
    });

    it('rejects an account registered with another provider', async () => {
      mockGoogleResponse({
        aud: 'google-client-id',
        email: 'test@example.com',
        email_verified: true,
        sub: 'google-sub',
      });
      users.findByEmailWithoutPassword.mockResolvedValue({
        ...validUser,
        provider: AuthProviderEnum.SYSTEM,
      });

      await expect(service.googleCredential(dto, 'issuer'))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects an invalid Google token response', async () => {
      mockGoogleResponse({}, false);
      await expect(service.googleCredential(dto, 'issuer'))
        .rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a token with the wrong audience', async () => {
      mockGoogleResponse({
        aud: 'wrong-client-id',
        email: 'test@example.com',
        email_verified: true,
        sub: 'google-sub',
      });

      await expect(service.googleCredential(dto, 'issuer'))
        .rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('fails when Google sign-in is not configured', async () => {
      config.get.mockReturnValue(undefined);

      await expect(service.googleCredential(dto, 'issuer'))
        .rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(fetch).not.toHaveBeenCalled();
    });

    it('maps Google network errors to ServiceUnavailableException', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('network down'));

      await expect(service.googleCredential(dto, 'issuer'))
        .rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });

  describe('sendVerificationEmail', () => {
    it('sends and caches a hashed OTP', async () => {
      users.findByEmailWithoutPassword.mockResolvedValue({
        ...validUser,
        emailVerifiedAt: null,
      });
      security.hash.mockResolvedValue('hashed-otp');

      await expect(
        service.sendVerificationEmail({ email: 'test@example.com' }),
      ).resolves.toEqual({ sent: true });

      expect(mail.sendVerificationCode).toHaveBeenCalledWith(
        'test@example.com',
        123456,
      );
      expect(cache.setCache).toHaveBeenCalledWith({
        key: RedisKeys.emailVerification('test@example.com'),
        value: 'hashed-otp',
        options: { EX: 120 },
      });
    });

    it('throws NotFoundException for an unknown account', async () => {
      users.findByEmailWithoutPassword.mockResolvedValue(null);

      await expect(
        service.sendVerificationEmail({ email: 'missing@example.com' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects an already verified account', async () => {
      users.findByEmailWithoutPassword.mockResolvedValue(validUser);

      await expect(
        service.sendVerificationEmail({ email: 'test@example.com' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('verifyEmail', () => {
    it('verifies an account using a valid OTP', async () => {
      users.findByEmailWithoutPassword.mockResolvedValue({
        ...validUser,
        emailVerifiedAt: null,
      });
      cache.getCache.mockResolvedValue('hashed-otp');
      security.compare.mockResolvedValue(true);
      users.updateOne.mockResolvedValue({ modifiedCount: 1 });

      await expect(
        service.verifyEmail({ email: 'test@example.com', otp: '123456' }),
      ).resolves.toEqual({ verified: true });

      expect(users.updateOne).toHaveBeenCalledWith({
        filter: { _id: validUser._id, emailVerifiedAt: null },
        update: { $set: { emailVerifiedAt: expect.any(Date) } },
      });
      expect(cache.deleteCache).toHaveBeenCalledWith({
        key: RedisKeys.emailVerification('test@example.com'),
      });
    });

    it('rejects an unknown account', async () => {
      users.findByEmailWithoutPassword.mockResolvedValue(null);

      await expect(
        service.verifyEmail({ email: 'missing@example.com', otp: '123456' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects an already verified account', async () => {
      users.findByEmailWithoutPassword.mockResolvedValue(validUser);

      await expect(
        service.verifyEmail({ email: 'test@example.com', otp: '123456' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects missing or incorrect cached OTP', async () => {
      users.findByEmailWithoutPassword.mockResolvedValue({
        ...validUser,
        emailVerifiedAt: null,
      });
      cache.getCache.mockResolvedValue(null);

      await expect(
        service.verifyEmail({ email: 'test@example.com', otp: '123456' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects if the account was verified concurrently', async () => {
      users.findByEmailWithoutPassword.mockResolvedValue({
        ...validUser,
        emailVerifiedAt: null,
      });
      cache.getCache.mockResolvedValue('hashed-otp');
      security.compare.mockResolvedValue(true);
      users.updateOne.mockResolvedValue({ modifiedCount: 0 });

      await expect(
        service.verifyEmail({ email: 'test@example.com', otp: '123456' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('rotateToken', () => {
    it('rotates refresh token and returns camelCase credentials', async () => {
      tokens.rotateRefreshToken.mockResolvedValue(credentials);

      await expect(service.rotateToken('refresh-token', 'issuer')).resolves.toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });

      expect(tokens.rotateRefreshToken).toHaveBeenCalledWith({
        token: 'refresh-token',
        issuer: 'issuer',
      });
    });

    it('propagates refresh-token errors', async () => {
      tokens.rotateRefreshToken.mockRejectedValue(new UnauthorizedException());

      await expect(service.rotateToken('invalid-token', 'issuer'))
        .rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('revokes the current token for a single-session logout', async () => {
      tokens.revokeToken.mockResolvedValue(1);

      await expect(
        service.logout(validUser._id as never, 'token-id', ('CURRENT' as LogoutTypeEnum)),
      ).resolves.toEqual({ revoked: 1 });
    });

    it('revokes all tokens when action is ALL', async () => {
      tokens.logout.mockResolvedValue(4);

      await expect(
        service.logout(validUser._id as never, 'token-id', LogoutTypeEnum.ALL),
      ).resolves.toEqual({ revoked: 4 });

      expect(tokens.logout).toHaveBeenCalledWith(validUser._id);
      expect(tokens.revokeToken).not.toHaveBeenCalled();
    });
  });
});
