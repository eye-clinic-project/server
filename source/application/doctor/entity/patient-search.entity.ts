import type { Types } from 'mongoose';
import type { PatientSearchView } from './doctor.type.js';

export class PatientSearchEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly medicalRecordNumber: string,
    public readonly name: string,
    public readonly email: string,
    public readonly city: string,
    public readonly avatarUrl: string | null,
    public readonly assigned: boolean,
  ) {}
}

export const toPatientSearchEntity = (patient: PatientSearchView): PatientSearchEntity =>
  new PatientSearchEntity(
    patient._id,
    patient.medicalRecordNumber,
    patient.user.name,
    patient.user.email,
    patient.user.city,
    patient.user.avatarUrl ?? null,
    patient.assigned,
  );
