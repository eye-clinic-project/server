import { SetMetadata } from '@nestjs/common';
import { UserRoleEnum } from '../enum/security.enum.js';

export const roleName = 'Roles';
export const Role = (roles: UserRoleEnum[]) => {
  return SetMetadata(roleName, roles);
};
