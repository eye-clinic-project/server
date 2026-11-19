import { applyDecorators, UseGuards } from '@nestjs/common';
import { Authenticate, Public, type AuthenticateOptions } from '@nestjs/authentication';

import type { SystemRoleEnum } from '../enum/index.js';
import { AccessGuard, RolesGuard } from '../guard/index.js';
import { AllowRoles } from './role.decorator.js';

export interface AuthOptions extends AuthenticateOptions {
  roles?: SystemRoleEnum[];
  public?: boolean;
}

export function Auth({ roles = [], public: isPublic = false, ...option }: AuthOptions = {}) {
  if (isPublic) return applyDecorators(Public(), AllowRoles([]));
  return applyDecorators(Authenticate(option), AllowRoles(roles), UseGuards(AccessGuard, RolesGuard));
}
