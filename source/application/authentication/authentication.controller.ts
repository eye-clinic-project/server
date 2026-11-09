
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle, minutes, hours } from '@nestjs/throttler';
import type { Response } from 'express';

import { AuthenticationService } from './authentication.service.js';
import { UtilService } from '../../dependency/service/util.service.js';
import { TokenService } from '../../dependency/service/token.service.js';

import { SignUpDto } from './dto/signup.dto.js';
import { GoogleCredentialDto } from './dto/google-credential.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { EmailDto, VerifyEmailDto } from './dto/email.dto.js';
import { LogoutDto } from './dto/logout.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

import { Token } from '../../dependency/decorator/token.decorator.js';
import { TokenEnum } from '../../dependency/enum/security.enum.js';
import { AuthGuard } from '../../dependency/guard/auth.guard.js';
import { User } from '../../dependency/decorator/user.decorator.js';

import type { HUserDocument } from '../../database/model/user.model.js';
import type { IAuthReq } from '../../dependency/interface/ctx.interface.js';

@Controller(['authentication', 'api/v1/auth'])
@ApiTags('Authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly UtilService: UtilService,
    private readonly tokenService: TokenService,
  ) { }

  @Throttle({
    default: {
      limit: 3,
      ttl: hours(1),
      blockDuration: hours(5),
    },
  })
  @Post(['sign-up', 'signup'])
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body() body: SignUpDto) {
    return this.authenticationService.signUp(body);
  }

  @Throttle({
    default: {
      limit: 5,
      ttl: minutes(1),
      blockDuration: hours(1),
    },
  })
  @Post(['google', 'google-credential'])
  @HttpCode(HttpStatus.OK)
  async googleCredential(
    @Body() body: GoogleCredentialDto,
    @Req() request: IAuthReq,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authenticationService.googleCredential(
      body,
      this.UtilService.issuer(request),
    );

    response.status(result.statusCode);

    const { statusCode: _statusCode, ...credentials } = result;

    return credentials;
  }

  @Throttle({
    default: {
      limit: 5,
      ttl: minutes(1),
      blockDuration: hours(5),
    },
  })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto, @Req() request: IAuthReq) {
    return this.authenticationService.login(
      body,
      this.UtilService.issuer(request),
      request.ip ?? 'unknown',
    );
  }

  @Throttle({
    default: {
      limit: 3,
      ttl: hours(1),
      blockDuration: hours(5),
    },
  })
  @Post(['send-verify-email', 'resend-verification'])
  @HttpCode(HttpStatus.OK)
  sendVerificationEmail(@Body() body: EmailDto) {
    return this.authenticationService.sendVerificationEmail(body);
  }

  @Throttle({
    default: {
      limit: 5,
      ttl: minutes(1),
      blockDuration: hours(1),
    },
  })
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authenticationService.verifyEmail(body);
  }

  @Throttle({
    default: {
      limit: 10,
      ttl: minutes(1),
      blockDuration: minutes(15),
    },
  })
  @Post(['rotate-token', 'refresh-token'])
  @HttpCode(HttpStatus.OK)
  @Token(TokenEnum.REFRESH)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearerAuth')
  rotateToken(@Req() request: IAuthReq) {
    return this.authenticationService.rotateToken(
      this.tokenService.getBearerToken(request),
      this.UtilService.issuer(request),
    );
  }

  @Throttle({
    default: {
      limit: 3,
      ttl: minutes(1),
      blockDuration: hours(1),
    },
  })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authenticationService.forgotPassword(body);
  }

  @Throttle({
    default: {
      limit: 5,
      ttl: minutes(1),
      blockDuration: hours(1),
    },
  })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authenticationService.resetPassword(body);
  }

  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @Token(TokenEnum.ACCESS)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearerAuth')
  changePassword(
    @Body() body: ChangePasswordDto,
    @User() user: HUserDocument,
  ) {
    return this.authenticationService.changePassword(user, body);
  }

  @Get('me')
  @Token(TokenEnum.ACCESS)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearerAuth')
  currentUser(@User() user: HUserDocument) {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      city: user.city,
      avatarUrl: user.avatarUrl,
      role: user.role,
      provider: user.provider,
      emailVerifiedAt: user.emailVerifiedAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Throttle({
    default: {
      limit: 10,
      ttl: minutes(1),
      blockDuration: minutes(15),
    },
  })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Token(TokenEnum.ACCESS)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearerAuth')
  logout(
    @Body() body: LogoutDto,
    @User() user: HUserDocument,
    @Req() request: IAuthReq,
  ) {
    const userId = user._id;
    const tokenId = request.credentials.decoded.jti;

    if (!userId || !tokenId || !request.credentials.decoded.sub) {
      throw new BadRequestException('Invalid access token claims');
    }

    return this.authenticationService.logout(userId, tokenId, body.action);
  }
}
