import { applyDecorators, UseGuards } from '@nestjs/common';
import { Authenticate, Public, type AuthenticateOptions } from '@nestjs/authentication';

import type { SystemRoleEnum } from '../enum/index.js';
import { AccessGuard, RolesGuard } from '../guard/index.js';
import { AllowPendingDoctor, AllowRoles } from './role.decorator.js';

export interface AuthOptions extends AuthenticateOptions {
  roles?: SystemRoleEnum[];
  public?: boolean;
  allowPending?: boolean;
}

export function Auth({ roles = [], public: isPublic = false, allowPending = false, ...option }: AuthOptions = {}) {
  if (isPublic) return applyDecorators(Public(), AllowRoles([]));
  return applyDecorators(Authenticate(option), AllowRoles(roles), AllowPendingDoctor(allowPending), UseGuards(AccessGuard, RolesGuard));
}
