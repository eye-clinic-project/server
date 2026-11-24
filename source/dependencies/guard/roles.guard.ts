import { ForbiddenException, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AllowPendingDoctor, AllowRoles } from '../decorator/role.decorator.js';
import { resolveUser } from '../decorator/user.decorator.js';
import { DoctorVerificationStatus } from '../enum/database.enum.js';
import { SystemRoleEnum } from '../enum/security.enum.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];

    const roles = this.reflector.getAllAndOverride(AllowRoles, targets) ?? [];
    if (roles.length === 0) return true;

    const user = resolveUser(context);
    if (!user || !roles.includes(user.role)) throw new ForbiddenException('You do not have permission to perform this action');

    const pendingDoctor = this.reflector.getAllAndOverride(AllowPendingDoctor, targets) ?? false;
    if (user.role === SystemRoleEnum.DOCTOR && !pendingDoctor && user.doctorStatus !== DoctorVerificationStatus.APPROVED) {
      throw new ForbiddenException("This doctor's account has not been approved yet");
    }
    return true;
  }
}
