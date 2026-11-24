import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { AdminDoctorView } from '../../entity/admin.type.js';
import type { DoctorVerificationStatus } from '../../../../dependencies/enum/database.enum.js';

export class DecideDoctorCommand extends Command<AdminDoctorView> {
  constructor(
    public readonly doctorId: Types.ObjectId,
    public readonly adminId: Types.ObjectId,
    public readonly status: DoctorVerificationStatus.APPROVED | DoctorVerificationStatus.REJECTED,
    public readonly reason: string | null,
  ) {
    super();
  }
}
