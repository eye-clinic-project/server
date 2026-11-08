import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthenticationDto } from './register.dto.js';

export class UpdateAuthenticationDto extends PartialType(
  CreateAuthenticationDto,
) {}
