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
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { User } from '../../common/decorator/user.decorator.js';
import { Token } from '../../common/decorator/token.decorator.js';
import { TokenEnum } from '../../common/enum/security.enum.js';
import type { IAuthReq } from '../../common/interface/ctx.interface.js';
import { AuthenticationService } from './authentication.service.js';
import { CreateAuthenticationDto } from './dto/create-authentication.dto.js';
import { EmailDto, VerifyEmailDto } from './dto/email.dto.js';
import { GoogleCredentialDto } from './dto/google-credential.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { LogoutDto } from './dto/logout.dto.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { TokenService } from '../../common/service/token.service.js';
import { UtilService } from '../../common/service/util.service.js';


@Controller('authentication')
@ApiTags('Authentication')
export class AuthenticationController {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly UtilService : UtilService,
    private readonly tokenService : TokenService
  ) {}

  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body() body: CreateAuthenticationDto) {
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
