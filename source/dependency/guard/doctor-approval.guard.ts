import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { DoctorRepository } from '../../database/repository/doctor.repository.js';
import { allowPendingDoctorName } from '../decorator/doctor-approval.decorator.js';
import { DoctorVerificationStatus } from '../enum/database.enum.js';
import { SystemRoleEnum } from '../enum/security.enum.js';
import type { IAuthReq, IAuthSocket } from '../interface/ctx.interface.js';

export const DOCTOR_APPROVAL_CODES = {
  [DoctorVerificationStatus.PENDING]: 'DOCTOR_PENDING_APPROVAL',
  [DoctorVerificationStatus.REJECTED]: 'DOCTOR_REJECTED',
  missing: 'DOCTOR_PROFILE_INCOMPLETE',
} as const;

/**
 * Doctors can only use the API after an admin has approved their license.
 * Until then every route returns 403 with a `code` the client uses to show the waiting screen,
 * except routes marked with @AllowPendingDoctor().
 */
@Injectable()
export class DoctorApprovalGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly doctors: DoctorRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const holder = context.getType() === 'ws' ? context.switchToWs().getClient<IAuthSocket>() : context.switchToHttp().getRequest<IAuthReq>();

    const user = holder.credentials?.user;
    if (user?.role !== SystemRoleEnum.DOCTOR) return true;

    const allowed = this.reflector.getAllAndOverride<boolean | undefined>(allowPendingDoctorName, [context.getHandler(), context.getClass()]);
    if (allowed) return true;

    const profile = await this.doctors.findOne({
      filter: { user: user._id },
      projection: { verificationStatus: 1 },
      options: { lean: true },
    });

    if (!profile) {
      throw new ForbiddenException({
        message: 'Complete your doctor profile and license number first',
        code: DOCTOR_APPROVAL_CODES.missing,
      });
    }
    const status = (profile.verificationStatus as DoctorVerificationStatus | undefined) ?? DoctorVerificationStatus.PENDING;
    if (status === DoctorVerificationStatus.APPROVED) return true;

    throw new ForbiddenException({
      message:
        status === DoctorVerificationStatus.REJECTED
          ? 'Your medical license was not approved. Update your license number to request a new review'
          : 'Your medical license is waiting for admin approval',
      code: DOCTOR_APPROVAL_CODES[status],
    });
  }
}
