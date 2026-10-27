
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { tokenTypeName } from '../decorator/token.decorator.js';
import { TokenService } from '../service/token.service.js';
import { TokenEnum } from '../enum/security.enum.js';
import { CtxType, IAuthReq, IAuthSocket } from '../interface/ctx.interface.js';
import { UtilService } from '../service/util.service.js';



@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
    private readonly utilService : UtilService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tokenType =
      this.reflector.getAllAndOverride<TokenEnum>(
        tokenTypeName,
        [context.getHandler(), context.getClass()],
      ) ?? TokenEnum.ACCESS;

    let req: IAuthReq | IAuthSocket;
    let authorization: string | undefined;

    switch (context.getType<CtxType>()) {
      case 'http': {
        req = context.switchToHttp().getRequest<IAuthReq>();
        authorization = req.headers.authorization;
        break;
      }

      case 'graphql': {
        const gqlContext = GqlExecutionContext.create(context);
        req = gqlContext.getContext<{ req: IAuthReq }>().req;
        authorization = req?.headers?.authorization;
        break;
      }

      case 'ws': {
        const client = context.switchToWs().getClient<IAuthSocket>();
        req = client;

        const socketToken = this.utilService.getAuthSocket(client);

        authorization = socketToken
          ? socketToken.startsWith('Bearer ')
            ? socketToken
            : `Bearer ${socketToken}`
          : undefined;

        break;
      }

      default:
        throw new UnauthorizedException(
          'Unsupported execution context',
        );
    }

    if (!authorization) {
      throw new UnauthorizedException('Missing authorization');
    }

    const [scheme, credential, ...extra] = authorization.trim().split(/\s+/);

    if (!scheme || !credential || extra.length > 0) {
      throw new UnauthorizedException('Invalid authorization format');
    }

    if (scheme.toLowerCase() !== 'bearer') {
      throw new UnauthorizedException('Unsupported authorization scheme');
    }

    req.credentials = await this.tokenService.decodeToken({
      token: credential,
      tokenType,
    });

    return true;
  }
}
