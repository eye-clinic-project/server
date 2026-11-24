import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { IAppointment } from '../../../../dependencies/interface/database.interface.js';

export class WithdrawRequestCommand extends Command<IAppointment | null> {
  constructor(
    public readonly appointmentId: Types.ObjectId,
    public readonly patientId: Types.ObjectId,
  ) {
    super();
  }
}
