import { ForbiddenException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard, matchRoles } from './roles.guard.js';
import { SystemRoleEnum } from '../enum/security.enum.js';

const ctx = (role: SystemRoleEnum | undefined) =>
  ({
    getType: () => 'http',
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ credentials: role ? { user: { role } } : undefined }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  it('matchRoles allows everyone when no roles are required', () => {
    expect(matchRoles([], undefined)).toBe(true);
    expect(matchRoles([SystemRoleEnum.DOCTOR], SystemRoleEnum.PATIENT)).toBe(false);
    expect(matchRoles([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN], SystemRoleEnum.ADMIN)).toBe(true);
  });

  it('returns 403 for an authenticated user with the wrong role (NFR10)', () => {
    const reflector = { getAllAndOverride: () => [SystemRoleEnum.DOCTOR] } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(ctx(SystemRoleEnum.PATIENT))).toThrow(ForbiddenException);
    expect(guard.canActivate(ctx(SystemRoleEnum.DOCTOR))).toBe(true);
  });
});
