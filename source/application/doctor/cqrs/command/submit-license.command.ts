import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import type { DoctorClinicView } from '../../entity/index.js';
import type { ILicenseDocument } from '../../../../dependencies/interface/index.js';

export class SubmitLicenseCommand extends Command<{ doctor: DoctorClinicView; replaced: ILicenseDocument[] }> {
  constructor(
    public readonly userId: Types.ObjectId,
    public readonly licenseNumber: string,
    public readonly documents: ILicenseDocument[],
  ) {
    super();
  }
}
