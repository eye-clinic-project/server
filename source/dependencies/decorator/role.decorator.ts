import { Reflector } from '@nestjs/core';
import { SystemRoleEnum } from '../enum/security.enum.js';

export const AllowRoles = Reflector.createDecorator<SystemRoleEnum[]>();
export const AllowPendingDoctor = Reflector.createDecorator<boolean>();
