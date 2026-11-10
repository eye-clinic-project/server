import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { Role } from './role.decorator.js';
import { SystemRoleEnum, TokenEnum } from '../enum/security.enum.js';
import { Token } from './token.decorator.js';
import { AuthGuard } from '../guard/auth.guard.js';
import { RolesGuard } from '../guard/roles.guard.js';
import { DoctorApprovalGuard } from '../guard/doctor-approval.guard.js';

/**
 * Requires a valid access token. When roles are given, the user must have one of them.
 * Unauthenticated requests get 401, authenticated users with the wrong role get 403.
 * Doctors also need an admin-approved license (see DoctorApprovalGuard and @AllowPendingDoctor).
 */
export const Auth = (roles: SystemRoleEnum[] = [], type: TokenEnum = TokenEnum.ACCESS) => {
  return applyDecorators(
    Token(type),
    Role(roles),
    UseGuards(AuthGuard, RolesGuard, DoctorApprovalGuard),
    ApiBearerAuth('bearerAuth'),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiForbiddenResponse({ description: 'Forbidden' }),
  );
};
