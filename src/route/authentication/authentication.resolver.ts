import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import type { Request } from 'express';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { LogoutTypeEnum, UserRoleEnum } from '../../common/enum/security.enum.js';
import type { IAuthReq } from '../../common/interface/ctx.interface.js';
import { GraphQLJSON } from '../../common/graphql/json.scalar.js';
import { validateGraphqlInput } from '../../common/graphql/validate-graphql-input.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { AuthenticationService } from './authentication.service.js';
import { CreateAuthenticationDto } from './dto/create-authentication.dto.js';
import { EmailDto, VerifyEmailDto } from './dto/email.dto.js';
import { GoogleCredentialDto } from './dto/google-credential.dto.js';
import { LoginDto } from './dto/login.dto.js';

type GraphqlRequest = Request & IAuthReq;

@Resolver()
export class AuthenticationResolver {
  constructor(
    private readonly authentication: AuthenticationService,
    private readonly config: ConfigService,
  ) {}

  @Mutation(() => GraphQLJSON)
  async signUp(
    @Args('input', { type: () => GraphQLJSON }) input: CreateAuthenticationDto,
  ) {
    return this.authentication.signUp(
      await validateGraphqlInput(input, CreateAuthenticationDto),
    );
  }

  @Mutation(() => GraphQLJSON)
  async login(
    @Args('input', { type: () => GraphQLJSON }) input: LoginDto,
    @Context('req') request: Request,
  ) {
    return this.authentication.login(
      await validateGraphqlInput(input, LoginDto),
      this.issuer(request),
      request.ip ?? 'unknown',
    );
  }

  @Mutation(() => GraphQLJSON)
  async googleCredential(
    @Args('input', { type: () => GraphQLJSON }) input: GoogleCredentialDto,
    @Context('req') request: Request,
  ) {
    return this.authentication.googleCredential(
      await validateGraphqlInput(input, GoogleCredentialDto),
      this.issuer(request),
    );
  }

  @Mutation(() => GraphQLJSON)
  async sendVerificationEmail(
    @Args('input', { type: () => GraphQLJSON }) input: EmailDto,
  ) {
    return this.authentication.sendVerificationEmail(
      await validateGraphqlInput(input, EmailDto),
    );
  }

  @Mutation(() => GraphQLJSON)
  async verifyEmail(
    @Args('input', { type: () => GraphQLJSON }) input: VerifyEmailDto,
  ) {
    return this.authentication.verifyEmail(
      await validateGraphqlInput(input, VerifyEmailDto),
    );
  }

  @Mutation(() => GraphQLJSON)
  rotateRefreshToken(
    @Args('refreshToken') refreshToken: string,
    @Context('req') request: Request,
  ) {
    return this.authentication.rotateToken(
      refreshToken,
      this.issuer(request),
    );
  }

  @Mutation(() => GraphQLJSON)
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  logout(
    @User() user: HUserDocument,
    @Context('req') request: GraphqlRequest,
    @Args('allSessions', { nullable: true, defaultValue: false })
    allSessions: boolean,
  ) {
    const tokenId = request.credentials?.decoded.jti;
    if (!user._id || !tokenId) {
      throw new BadRequestException('Invalid access token claims');
    }
    return this.authentication.logout(
      user._id,
      tokenId,
      allSessions ? LogoutTypeEnum.ALL : LogoutTypeEnum.SINGLE,
    );
  }

  private issuer(request: Request) {
    const configuredIssuer = this.config.get<string>('auth.issuer');
    if (configuredIssuer) {
      return configuredIssuer;
    }
    const host = request.get('host');
    if (!host) {
      throw new BadRequestException('Could not determine token issuer');
    }
    return `${request.protocol}://${host}`;
  }
}