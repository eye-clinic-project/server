import { applyDecorators, UseGuards } from '@nestjs/common';

import { Role } from './role.decorator.js';
import { TokenEnum, SystemRoleEnum } from '../enum/security.enum.js';
import { Token } from './token.decorator.js';
import { AuthGuard } from '../guard/auth.guard.js';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../guard/roles.guard.js';

export const Auth = (
  roles: SystemRoleEnum[],
  type: TokenEnum = TokenEnum.ACCESS,
) => {
  return applyDecorators(
    Token(type),
    Role(roles),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth('bearerAuth'),
  );
};
