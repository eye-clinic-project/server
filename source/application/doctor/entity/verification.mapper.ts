import type { DoctorClinicView } from './doctor.type.js';
import { VerificationEntity } from './verification.entity.js';
import { toLicenseDocumentEntity } from './license-document.mapper.js';

export const toVerificationEntity = (doctor: DoctorClinicView): VerificationEntity =>
  new VerificationEntity(
    doctor.verificationStatus ?? null,
    doctor.licenseNumber ?? null,
    doctor.verificationSubmittedAt ?? null,
    doctor.verifiedAt ?? null,
    doctor.rejectionReason ?? null,
    (doctor.licenseDocuments ?? []).map(toLicenseDocumentEntity),
  );
