import type { DoctorVerificationStatus } from '../../../dependencies/enum/index.js';
import { LicenseDocumentEntity } from './license-document.entity.js';

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
