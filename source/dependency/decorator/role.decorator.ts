import { SetMetadata } from '@nestjs/common';
import { SystemRoleEnum } from '../enum/security.enum.js';

export const roleName = 'ROLES_OPTION';
export const Role = (roles: SystemRoleEnum[]) => {
  return SetMetadata(roleName, roles);
};
