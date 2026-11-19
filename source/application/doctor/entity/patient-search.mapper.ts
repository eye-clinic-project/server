import type { PatientSearchView } from './doctor.type.js';
import { PatientSearchEntity } from './patient-search.entity.js';

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
