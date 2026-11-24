import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { DoctorClinicView } from '../../entity/doctor.type.js';
import type { ILicenseDocument } from '../../../../dependencies/interface/database.interface.js';

export class SubmitLicenseCommand extends Command<{ doctor: DoctorClinicView; replaced: ILicenseDocument[] }> {
  constructor(
    public readonly userId: Types.ObjectId,
    public readonly licenseNumber: string,
    public readonly documents: ILicenseDocument[],
  ) {
    super();
  }
}
