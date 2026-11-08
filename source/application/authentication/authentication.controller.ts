import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthenticationService } from './authentication.service.js';
import { UtilService } from '../../dependency/service/util.service.js';
import { TokenService } from '../../dependency/service/token.service.js';
import { SignUpDto } from './dto/signup.dto.js';
import { GoogleCredentialDto } from './dto/google-credential.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { EmailDto, VerifyEmailDto } from './dto/email.dto.js';
import { Token } from '../../dependency/decorator/token.decorator.js';
import { TokenEnum } from '../../dependency/enum/security.enum.js';
import { AuthGuard } from '../../dependency/guard/auth.guard.js';
import { LogoutDto } from './dto/logout.dto.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import type { IAuthReq } from './../../dependency/interface/ctx.interface.js';
import { Throttle } from '@nestjs/throttler';


@Controller('authentication')
@ApiTags('Authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly UtilService: UtilService,
    private readonly tokenService: TokenService,
  ) { }

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body() body: SignUpDto) {
    return this.authenticationService.signUp(body);
  }

  @Post('google-credential')
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

  @Throttle({ default: { limit: 5, ttl: 60_000  , blockDuration: 60 * 60 * 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() body: LoginDto, @Req() request: IAuthReq) {
    return this.authenticationService.login(
      body,
      this.UtilService.issuer(request),
      request.ip ?? 'unknown',
    );
  }

  @Post('send-verify-email')
  @HttpCode(HttpStatus.OK)
  sendVerificationEmail(@Body() body: EmailDto) {
    return this.authenticationService.sendVerificationEmail(body);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authenticationService.verifyEmail(body);
  }

  @Post('rotate-token')
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
