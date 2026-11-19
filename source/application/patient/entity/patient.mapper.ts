import { Types } from 'mongoose';

import type { GenderEnum } from '../../../dependencies/enum/index.js';
import { HPatientDocument } from '../../../database/model/index.js';
import { PatientEntity } from './patient.entity.js';
import { type PatientUserView, toPatientAccountEntity } from './patient-account.mapper.js';

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
