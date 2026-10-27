import { applyDecorators, UseGuards } from '@nestjs/common';

import { RolesGuard } from '../guard/role.guard.js';
import { Role } from './role.decorator.js';
import { TokenEnum, UserRoleEnum } from '../enum/security.enum.js';
import { AuthenticationGuard } from '@nestjs/authentication';
import { Token } from './token.decorator.js';

export const Auth = (roles: UserRoleEnum[], type: TokenEnum = TokenEnum.ACCESS) => {
  return applyDecorators(
    Token(type),
    Role(roles),
    UseGuards(AuthenticationGuard, RolesGuard)
  )
}