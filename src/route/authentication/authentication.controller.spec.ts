import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller.js';
import { AuthenticationService } from './authentication.service.js';
import { UtilService } from '../../common/service/util.service.js';
import { TokenService } from '../../common/service/token.service.js';
import { LogoutTypeEnum } from '../../common/enum/security.enum.js';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;

  const auth = {
    signUp: vi.fn(),
    googleCredential: vi.fn(),
    login: vi.fn(),
    sendVerificationEmail: vi.fn(),
    verifyEmail: vi.fn(),
    rotateToken: vi.fn(),
    logout: vi.fn(),
  };
  const util = { issuer: vi.fn() };
  const tokens = { getBearerToken: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        { provide: AuthenticationService, useValue: auth },
        { provide: UtilService, useValue: util },
        { provide: TokenService, useValue: tokens },
      ],
    }).compile();

    controller = module.get(AuthenticationController);
    util.issuer.mockReturnValue('test-issuer');
    tokens.getBearerToken.mockReturnValue('refresh-token');
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('signUp delegates to the service', async () => {
    const dto = {
      name: 'Ahmed',
      email: 'test@example.com',
      password: 'Password123!',
      city: 'Cairo',
    };
    auth.signUp.mockResolvedValue({
      email: dto.email,
      emailVerificationRequired: true,
    });

    await expect(controller.signUp(dto)).resolves.toEqual({
      email: dto.email,
      emailVerificationRequired: true,
    });
    expect(auth.signUp).toHaveBeenCalledWith(dto);
  });

  it('googleCredential sets response status and removes statusCode from body', async () => {
    const request = { headers: {}, ip: '127.0.0.1' };
    const response = { status: vi.fn() };
    const dto = { idToken: 'google-id-token', city: 'Cairo' };

    auth.googleCredential.mockResolvedValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      statusCode: 201,
    });

    await expect(
      controller.googleCredential(dto as never, request as never, response as never),
    ).resolves.toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
    });

    expect(util.issuer).toHaveBeenCalledWith(request);
    expect(response.status).toHaveBeenCalledWith(201);
    expect(auth.googleCredential).toHaveBeenCalledWith(dto, 'test-issuer');
  });

  it('login passes DTO, issuer, and IP to the service', async () => {
    const dto = { email: 'test@example.com', password: 'Password123!' };
    const request = { headers: {}, ip: '127.0.0.1' };
    auth.login.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });

    await expect(controller.login(dto, request as never)).resolves.toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
    expect(auth.login).toHaveBeenCalledWith(dto, 'test-issuer', '127.0.0.1');
  });

  it('login uses unknown when request IP is absent', async () => {
    const request = { headers: {} };
    auth.login.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });

    await controller.login(
      { email: 'test@example.com', password: 'Password123!' },
      request as never,
    );

    expect(auth.login).toHaveBeenCalledWith(
      { email: 'test@example.com', password: 'Password123!' },
      'test-issuer',
      'unknown',
    );
  });

  it('sendVerificationEmail delegates to the service', async () => {
    const dto = { email: 'test@example.com' };
    auth.sendVerificationEmail.mockResolvedValue({ sent: true });

    await expect(controller.sendVerificationEmail(dto)).resolves.toEqual({ sent: true });
    expect(auth.sendVerificationEmail).toHaveBeenCalledWith(dto);
  });

  it('verifyEmail delegates to the service', async () => {
    const dto = { email: 'test@example.com', otp: '123456' };
    auth.verifyEmail.mockResolvedValue({ verified: true });

    await expect(controller.verifyEmail(dto)).resolves.toEqual({ verified: true });
    expect(auth.verifyEmail).toHaveBeenCalledWith(dto);
  });

  it('rotateToken extracts the bearer token and passes the issuer', async () => {
    const request = { headers: {} };
    auth.rotateToken.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });

    await expect(controller.rotateToken(request as never)).resolves.toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });

    expect(tokens.getBearerToken).toHaveBeenCalledWith(request);
    expect(auth.rotateToken).toHaveBeenCalledWith('refresh-token', 'test-issuer');
  });

  it('logout delegates current user and token claims to the service', async () => {
    const user = { _id: '507f1f77bcf86cd799439011' };
    const request = {
      credentials: {
        decoded: { jti: 'token-id', sub: user._id },
      },
    };
    const dto = { action: 'CURRENT' as LogoutTypeEnum };
    auth.logout.mockResolvedValue({ revoked: 1 });

    await expect(
      controller.logout(dto as never, user as never, request as never),
    ).resolves.toEqual({ revoked: 1 });

    expect(auth.logout).toHaveBeenCalledWith(user._id, 'token-id', dto.action);
  });

  it('logout rejects missing access-token claims', async () => {
    const user = { _id: '507f1f77bcf86cd799439011' };
    const request = { credentials: { decoded: { jti: undefined, sub: user._id } } };

    await expect(
      controller.logout({ action: 'CURRENT' } as never, user as never, request as never),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(auth.logout).not.toHaveBeenCalled();
  });
});
