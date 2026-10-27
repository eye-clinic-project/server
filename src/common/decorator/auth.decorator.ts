import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guard/auth.guard.js';
import { RolesGuard } from '../guard/role.guard.js';
import { Roles } from './role.decorator.js';
import { UserRoleEnum } from '../enum/security.enum.js';

export const Auth = (...roles: UserRoleEnum[]) => {
  return applyDecorators(Roles(...roles), UseGuards(JwtAuthGuard, RolesGuard));
};
