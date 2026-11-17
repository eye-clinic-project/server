import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { Role } from './role.decorator.js';
import { SystemRoleEnum, TokenEnum } from '../enum/security.enum.js';
import { Token } from './token.decorator.js';
import { AuthGuard } from '../guard/auth.guard.js';
import { RolesGuard } from '../guard/roles.guard.js';
import { DoctorApprovalGuard } from '../guard/doctor-approval.guard.js';

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
