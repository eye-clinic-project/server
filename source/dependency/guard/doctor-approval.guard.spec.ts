import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Types } from 'mongoose';
import { DoctorApprovalGuard } from './doctor-approval.guard.js';
import { SystemRoleEnum } from '../enum/security.enum.js';
import { DoctorVerificationStatus } from '../enum/database.enum.js';
import type { DoctorRepository } from '../../database/repository/doctor.repository.js';

const ctx = (role: SystemRoleEnum) =>
  ({
    getType: () => 'http',
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ credentials: { user: { _id: new Types.ObjectId(), role } } }) }),
  }) as unknown as ExecutionContext;

const guardFor = (profile: unknown, allowPending = false) => {
  const reflector = { getAllAndOverride: () => allowPending } as unknown as Reflector;
  const doctors = { findOne: async () => profile } as unknown as DoctorRepository;
  return new DoctorApprovalGuard(reflector, doctors);
};

const codeOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return 'allowed';
  } catch (error) {
    expect(error).toBeInstanceOf(ForbiddenException);
    return ((error as ForbiddenException).getResponse() as { code: string }).code;
  }
};

describe('DoctorApprovalGuard', () => {
  it('ignores patients and admins', async () => {
    const guard = guardFor(null);
    expect(await guard.canActivate(ctx(SystemRoleEnum.PATIENT))).toBe(true);
    expect(await guard.canActivate(ctx(SystemRoleEnum.ADMIN))).toBe(true);
  });

  it('lets approved doctors through', async () => {
    const guard = guardFor({ verificationStatus: DoctorVerificationStatus.APPROVED });
    expect(await guard.canActivate(ctx(SystemRoleEnum.DOCTOR))).toBe(true);
  });

  it('blocks pending, rejected, legacy and profile-less doctors with a code', async () => {
    expect(await codeOf(guardFor({ verificationStatus: DoctorVerificationStatus.PENDING }).canActivate(ctx(SystemRoleEnum.DOCTOR)))).toBe(
      'DOCTOR_PENDING_APPROVAL',
    );
    expect(await codeOf(guardFor({ verificationStatus: DoctorVerificationStatus.REJECTED }).canActivate(ctx(SystemRoleEnum.DOCTOR)))).toBe('DOCTOR_REJECTED');
    expect(await codeOf(guardFor({}).canActivate(ctx(SystemRoleEnum.DOCTOR)))).toBe('DOCTOR_PENDING_APPROVAL');
    expect(await codeOf(guardFor(null).canActivate(ctx(SystemRoleEnum.DOCTOR)))).toBe('DOCTOR_PROFILE_INCOMPLETE');
  });

  it('allows routes marked @AllowPendingDoctor()', async () => {
    const guard = guardFor({ verificationStatus: DoctorVerificationStatus.PENDING }, true);
    expect(await guard.canActivate(ctx(SystemRoleEnum.DOCTOR))).toBe(true);
  });
});
