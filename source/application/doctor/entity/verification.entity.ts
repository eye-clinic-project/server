import type { DoctorVerificationStatus } from '../../../dependencies/enum/database.enum.js';
import { LicenseDocumentEntity, toLicenseDocumentEntity } from './license-document.entity.js';
import type { DoctorClinicView } from '../type/doctor.type.js';

export class VerificationEntity {
  constructor(
    public readonly status: DoctorVerificationStatus | null,
    public readonly licenseNumber: string | null,
    public readonly submittedAt: Date | null,
    public readonly verifiedAt: Date | null,
    public readonly rejectionReason: string | null,
    public readonly documents: LicenseDocumentEntity[],
  ) {}
}

export const toVerificationEntity = (doctor: DoctorClinicView): VerificationEntity =>
  new VerificationEntity(
    doctor.verificationStatus ?? null,
    doctor.licenseNumber ?? null,
    doctor.verificationSubmittedAt ?? null,
    doctor.verifiedAt ?? null,
    doctor.rejectionReason ?? null,
    (doctor.licenseDocuments ?? []).map(toLicenseDocumentEntity),
  );
