import { applyDecorators, UseGuards } from '@nestjs/common';
import { Authenticate, Public, type AuthenticateOptions } from '@nestjs/authentication';

import type { SystemRoleEnum } from '../enum/security.enum.js';
import { AccessGuard } from '../guard/access.guard.js';
import { RolesGuard } from '../guard/roles.guard.js';
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
