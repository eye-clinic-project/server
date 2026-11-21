import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Auth } from '../decorator/index.js';
import { DoctorVerificationStatus, SystemRoleEnum } from '../enum/index.js';
import type { IUser } from '../interface/index.js';
import { RolesGuard } from './roles.guard.js';

const { DOCTOR, PATIENT } = SystemRoleEnum;

@Auth()
class FakeController {
  @Auth({ roles: [DOCTOR] })
  approvedOnly() {}

  @Auth({ roles: [DOCTOR], allowPending: true })
  pendingAllowed() {}

  anyUser() {}
}

const contextFor = (handler: keyof FakeController, user: Partial<IUser>) =>
  ({
    getHandler: () => FakeController.prototype[handler],
    getClass: () => FakeController,
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

const doctor = (doctorStatus: DoctorVerificationStatus) => ({ role: DOCTOR, doctorStatus });

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  it('lets an approved doctor use doctor routes', () => {
    expect(guard.canActivate(contextFor('approvedOnly', doctor(DoctorVerificationStatus.APPROVED)))).toBe(true);
  });

  it('refuses a pending doctor on routes that need approval', () => {
    expect(() => guard.canActivate(contextFor('approvedOnly', doctor(DoctorVerificationStatus.PENDING)))).toThrow(ForbiddenException);
  });

  it('lets a pending doctor use routes marked allowPending', () => {
    expect(guard.canActivate(contextFor('pendingAllowed', doctor(DoctorVerificationStatus.PENDING)))).toBe(true);
    expect(guard.canActivate(contextFor('pendingAllowed', doctor(DoctorVerificationStatus.REJECTED)))).toBe(true);
  });

  it('refuses other roles', () => {
    expect(() => guard.canActivate(contextFor('pendingAllowed', { role: PATIENT }))).toThrow(ForbiddenException);
  });

  it('allows any signed-in user on routes without roles', () => {
    expect(guard.canActivate(contextFor('anyUser', doctor(DoctorVerificationStatus.PENDING)))).toBe(true);
  });
});
