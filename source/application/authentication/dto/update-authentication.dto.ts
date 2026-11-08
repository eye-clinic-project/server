import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthenticationDto } from './create-authentication.dto.js';

export class UpdateAuthenticationDto extends PartialType(
  CreateAuthenticationDto,
) {}
