import { Controller, Post, Body, HttpCode, HttpStatus, Res, Get, UnauthorizedException, Headers } from '@nestjs/common';
import type { Response } from 'express';
import { AuthenticationService } from './authentication.service.js';
import { TokenPair, TokenService } from '@nestjs/authentication';
import { hours, minutes } from '@nestjs/throttler';
import { Auth } from '../../dependencies/decorator/auth.decorator.js';
import { RateLimit } from '../../dependencies/decorator/rate-limit.decorator.js';
import { User } from '../../dependencies/decorator/user.decorator.js';
import { EmailDto } from './dto/email.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { GoogleSignInDto } from './dto/google-sign-in.dto.js';
import { LogoutDto } from './dto/logout.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { SignInDto } from './dto/sign-in.dto.js';
import { SignUpDto } from './dto/sign-up.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import type { IUser } from '../../dependencies/interface/database.interface.js';
import { AuthenticationEntity } from './entity/authentication.entity.js';
import { DecodedToken, JwtTokenService } from '../../dependencies/service/token.service.js';

@Controller('authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly tokenService: TokenService,
    private readonly jwtTokenService: JwtTokenService,
  ) {}

  @RateLimit({ limit: 10, ttl: hours(1), block: hours(5) })
  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @Auth({ optional: true })
  signUp(@Body() body: SignUpDto): Promise<AuthenticationEntity> {
    return this.authenticationService.signUp(body);
  }

  @RateLimit({ limit: 5, ttl: minutes(1), block: hours(5) })
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @Auth({ optional: true })
  signIn(@Body() body: SignInDto): Promise<TokenPair> {
    return this.authenticationService.signIn(body);
  }

  @RateLimit({ limit: 10, ttl: minutes(1), block: minutes(15) })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @Auth()
  logout(@User() user: IUser, @Body() body: LogoutDto): Promise<void> {
    return this.authenticationService.logout(user._id!.toString(), body);
  }

  @RateLimit({ limit: 3, ttl: hours(1), block: hours(5) })
  @Post('verify-email/send')
  @HttpCode(HttpStatus.ACCEPTED)
  @Auth({ optional: true })
  sendVerifyEmail(@Body() body: EmailDto): void {
    this.authenticationService.sendVerifyEmail(body);
  }

  @RateLimit({ limit: 5, ttl: minutes(1), block: hours(1) })
  @Post('verify-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ optional: true })
  verifyEmail(@Body() body: VerifyEmailDto): Promise<void> {
    return this.authenticationService.verifyEmail(body);
  }

  @RateLimit({ limit: 3, ttl: minutes(1), block: hours(1) })
  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @Auth({ optional: true })
  forgotPassword(@Body() body: ForgotPasswordDto): void {
    this.authenticationService.forgotPassword(body);
  }

  @RateLimit({ limit: 5, ttl: minutes(1), block: hours(1) })
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ optional: true })
  resetPassword(@Body() body: ResetPasswordDto): Promise<void> {
    return this.authenticationService.resetPassword(body);
  }

  @RateLimit({ limit: 5, ttl: minutes(1), block: hours(5) })
  @Post('google')
  @Auth({ optional: true })
  async google(@Body() body: GoogleSignInDto, @Res({ passthrough: true }) res: Response): Promise<TokenPair> {
    const { created, tokens } = await this.authenticationService.googleSignIn(body);
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return tokens;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Auth({ optional: true })
  refresh(@Body() body: RefreshTokenDto): Promise<TokenPair> {
    return this.tokenService.refresh(body.refreshToken);
  }

  @Get('token')
  @Auth()
  async introspect(@Headers('authorization') authorization?: string): Promise<DecodedToken> {
    const [scheme, token] = authorization?.split(' ') ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !token) throw new UnauthorizedException('Invalid token payload');
    const { header } = this.jwtTokenService.decode(token);
    const payload = await this.jwtTokenService.verify(token);
    return { header, payload };
  }
}
