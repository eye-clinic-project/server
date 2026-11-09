import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationService } from './authentication.service.js';
import { UserRepository } from '../../database/repository/user.repository.js';
import { SecurityService } from '../../dependency/service/security.service.js';
import { TokenService } from '../../dependency/service/token.service.js';
import { CacheService, RedisKeys } from '../../dependency/service/cache.service.js';
import { UtilService } from '../../dependency/service/util.service.js';
import { MailService } from '../../dependency/service/mail.service.js';
import { ConfigService } from '@nestjs/config';
import { AuthProviderEnum } from '../../dependency/enum/security.enum.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { Types } from 'mongoose';
import { createHash } from 'node:crypto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  const userRepository = {
    findByEmail: vi.fn(),
    findHydratedById: vi.fn(),
    updateOne: vi.fn(),
  };
  const security = {
    compare: vi.fn(),
    hash: vi.fn(),
  };
  const tokens = {
    logout: vi.fn(),
  };
  const cache = {
    setCache: vi.fn(),
    getAndDelete: vi.fn(),
    deleteCache: vi.fn(),
  };
  const mail = {
    sendPasswordResetToken: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationService,
        { provide: UserRepository, useValue: userRepository },
        { provide: SecurityService, useValue: security },
        { provide: TokenService, useValue: tokens },
        { provide: CacheService, useValue: cache },
        { provide: UtilService, useValue: {} },
        { provide: MailService, useValue: mail },
        { provide: ConfigService, useValue: {} },
      ],
    }).compile();

    service = module.get<AuthenticationService>(AuthenticationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns the same response when no matching account exists', async () => {
    userRepository.findByEmail.mockResolvedValue(null);

    await expect(
      service.forgotPassword({ email: 'unknown@example.com' }),
    ).resolves.toEqual({ sent: true });
    expect(cache.setCache).not.toHaveBeenCalled();
    expect(mail.sendPasswordResetToken).not.toHaveBeenCalled();
  });

  it('stores only a hash of the emailed reset token with a ten-minute expiry', async () => {
    const userId = new Types.ObjectId();
    userRepository.findByEmail.mockResolvedValue({
      _id: userId,
      provider: AuthProviderEnum.SYSTEM,
      passwordHash: 'existing-hash',
    });

    await expect(
      service.forgotPassword({ email: 'person@example.com' }),
    ).resolves.toEqual({ sent: true });

    const [[cacheEntry]] = cache.setCache.mock.calls;
    const [[email, token]] = mail.sendPasswordResetToken.mock.calls;
    expect(email).toBe('person@example.com');
    expect(cacheEntry).toEqual({
      key: RedisKeys.passwordReset(
        createHash('sha256').update(token).digest('hex'),
      ),
      value: userId.toString(),
      options: { EX: 600 },
    });
  });

  it('consumes a reset token once, updates the password and revokes sessions', async () => {
    const userId = new Types.ObjectId();
    const user = {
      _id: userId,
      provider: AuthProviderEnum.SYSTEM,
    } as HUserDocument;
    const token = 'a'.repeat(43);
    cache.getAndDelete.mockResolvedValue(userId.toString());
    userRepository.findHydratedById.mockResolvedValue(user);
    security.hash.mockResolvedValue('new-password-hash');
    userRepository.updateOne.mockResolvedValue({ modifiedCount: 1 });

    await expect(
      service.resetPassword({ token, password: 'new-password' }),
    ).resolves.toEqual({ reset: true });

    expect(cache.getAndDelete).toHaveBeenCalledWith({
      key: RedisKeys.passwordReset(
        createHash('sha256').update(token).digest('hex'),
      ),
    });
    expect(userRepository.updateOne).toHaveBeenCalledWith({
      filter: { _id: userId },
      update: { $set: { passwordHash: 'new-password-hash' } },
    });
    expect(tokens.logout).toHaveBeenCalledWith(userId);
  });

  it('rejects a missing or expired reset token', async () => {
    cache.getAndDelete.mockResolvedValue(null);

    await expect(
      service.resetPassword({
        token: 'a'.repeat(43),
        password: 'new-password',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(userRepository.findHydratedById).not.toHaveBeenCalled();
  });

  it('does not change a password when the current password is incorrect', async () => {
    const user = {
      email: 'person@example.com',
      provider: AuthProviderEnum.SYSTEM,
      passwordHash: 'existing-hash',
    } as HUserDocument;
    userRepository.findByEmail.mockResolvedValue(user);
    security.compare.mockResolvedValue(false);

    await expect(
      service.changePassword(user, {
        currentPassword: 'wrong-password',
        newPassword: 'new-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(security.hash).not.toHaveBeenCalled();
    expect(userRepository.updateOne).not.toHaveBeenCalled();
  });
});
