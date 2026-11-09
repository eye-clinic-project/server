
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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, minutes, hours } from '@nestjs/throttler';
import type { Response } from 'express';

import { AuthenticationService } from './authentication.service.js';
import { UserService } from '../user/user.service.js';
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
import { RateLimit } from '../../dependency/decorator/rate-limit.decorator.js';

@Controller('api/v1/auth')
@ApiTags('Authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly UtilService: UtilService,
    private readonly tokenService: TokenService,
    private readonly userService: UserService,
  ) {}

  @Throttle({
    default: {
      limit: 3,
      ttl: hours(1),
      blockDuration: hours(5),
    },
  })
  @Post(['sign-up', 'signup'])
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Sign up with email and password",
    description: "Public. Creates a patient (default) or doctor account (FR1.1). Doctors must also send clinicName and clinicAddress. Send acceptTerms: true to record privacy consent (NFR11). A 6-digit verification code is emailed right away (FR1.3); the account cannot log in until it is verified. Duplicate emails return 409. Limited to 3 requests per hour per IP.",
  })
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
  @ApiOperation({
    summary: "Sign in or sign up with Google",
    description: "Public. Exchanges a Google ID token for RetinaCare tokens (FR1.1). Creates the account on first use (201, role from `role`, default patient) or logs in an existing Google account (200). Fails with 409 if the email already uses password sign-in.",
  })
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
  @ApiOperation({
    summary: "Log in with email and password",
    description: "Public. Returns an access token (15 min) and a refresh token (7 days) (FR1.2). Wrong email or password always returns the same 401 message, so it does not reveal which field was wrong. Unverified emails return 403 with code EMAIL_NOT_VERIFIED; disabled accounts return 403.",
  })
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
  @ApiOperation({
    summary: "Resend the email verification code",
    description: "Public. Emails a new 6-digit code that is valid for 10 minutes (FR1.3). Returns 409 if the email is already verified.",
  })
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
  @ApiOperation({
    summary: "Verify email with the 6-digit code",
    description: "Public. Activates the account when the code is correct and not expired (FR1.3). Expired or wrong codes return 400.",
  })
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
  @ApiOperation({
    summary: "Get new tokens with the refresh token",
    description: "Requires the REFRESH token as Bearer. Returns a new access/refresh pair. The old refresh token stops working (single use) and can only be renewed in its last 5 minutes.",
  })
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
  @ApiOperation({
    summary: "Request a password reset link",
    description: "Public. Emails a single-use reset link that expires after 15 minutes (FR1.4). Always returns { sent: true }, even for unknown emails, so accounts cannot be discovered. Patients created by a doctor also use this to set their first password.",
  })
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
  @ApiOperation({
    summary: "Set a new password with the reset token",
    description: "Public. Uses the token from the email link once (FR1.4). The old password stops working and all sessions are logged out. Using the link also verifies the email address.",
  })
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authenticationService.resetPassword(body);
  }

  @RateLimit.passwordCheck()
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  @Token(TokenEnum.ACCESS)
  @UseGuards(AuthGuard)
  @ApiBearerAuth('bearerAuth')
  @ApiOperation({
    summary: "Change password",
    description: "Any signed-in user with an email/password account. The current password is required (FR1.5); a wrong current password returns 401.",
  })
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
  @ApiOperation({
    summary: "Get the current user",
    description: "Any signed-in user. Returns the user, their role profile (doctor or patient), whether the profile is complete and which dashboard to open (FR1.2).",
  })
  currentUser(@User() user: HUserDocument) {
    return this.userService.getMe(user);
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
  @ApiOperation({
    summary: "Log out",
    description: "Any signed-in user. action = single revokes only this session; action = all revokes every session of the user.",
  })
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
