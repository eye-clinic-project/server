import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { DoctorSignUpData } from '../../type/authentication.type.js';

export class CreateDoctorProfileCommand extends Command<void> {
  constructor(
    public readonly userId: Types.ObjectId,
    public readonly data: DoctorSignUpData,
  ) {
    super();
  }
}
