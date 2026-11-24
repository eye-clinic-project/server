import { Types } from 'mongoose';

import type { GenderEnum } from '../../../dependencies/enum/database.enum.js';
import { PatientAccountEntity, type PatientUserView, toPatientAccountEntity } from './patient-account.entity.js';
import { HPatientDocument } from '../../../database/model/patient.model.js';

export class PatientEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly medicalRecordNumber: string,
    public readonly user: PatientAccountEntity,
    public readonly dateOfBirth: Date | null = null,
    public readonly gender: GenderEnum | null = null,
    public readonly emergencyContact: string | null = null,
    public readonly diabetesSince: number | null = null,
    public readonly medicalNotes: string | null = null,
    public readonly createdBy: Types.ObjectId | null = null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}
}

export type PatientView = Omit<HPatientDocument, 'user'> & { _id: Types.ObjectId; user: PatientUserView };
export const toPatientEntity = (patient: PatientView): PatientEntity =>
  new PatientEntity(
    patient._id,
    patient.medicalRecordNumber,
    toPatientAccountEntity(patient.user),
    patient.dateOfBirth ?? null,
    (patient.gender as GenderEnum | undefined) ?? null,
    patient.emergencyContact ?? null,
    patient.diabetesSince ?? null,
    patient.medicalNotes ?? null,
    patient.createdBy ?? null,
    patient.createdAt,
    patient.updatedAt,
  );
