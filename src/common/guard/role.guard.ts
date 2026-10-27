
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

import { ROLES_KEY } from '../decorator/role.decorator.js';
import { CtxType, IAuthReq, IAuthSocket } from '../interface/ctx.interface.js';


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!roles?.length) {
      return true;
    }

    let req: IAuthReq | IAuthSocket;

    switch (context.getType<CtxType>()) {
      case 'http':
        req = context.switchToHttp().getRequest<IAuthReq>();
        break;

      case 'graphql':
        req = GqlExecutionContext.create(context)
          .getContext<{ req: IAuthReq }>()
          .req;
        break;

      case 'ws':
        req = context.switchToWs().getClient<IAuthSocket>();
        break;

      default:
        throw new ForbiddenException('Unsupported execution context');
    }

    const user = req?.credentials?.user;

    if (!user) {
      throw new UnauthorizedException('User is not authenticated');
    }

    if (!roles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission');
    }

    return true;
  }
}
