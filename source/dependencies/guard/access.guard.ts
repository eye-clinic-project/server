import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';

import { resolveUser } from '../decorator/index.js';

@Injectable()
export class AccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = resolveUser(context);
    if (user && user.isActive === false) throw new ForbiddenException('This account has been disabled');
    return true;
  }
}
