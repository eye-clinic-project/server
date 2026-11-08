import { PartialType } from '@nestjs/mapped-types';
import { SignUpDto } from './signup.dto.js';

export class UpdateAuthenticationDto extends PartialType(
  SignUpDto,
) {}
