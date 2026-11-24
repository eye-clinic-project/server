import type { Types } from 'mongoose';

import type { DoctorVerificationStatus } from '../../../dependencies/enum/database.enum.js';
import type { AdminDoctorView } from './admin.type.js';
import { toLicenseDocumentEntity, type LicenseDocumentEntity } from '../../doctor/entity/license-document.entity.js';

export class AdminDoctorEntity {
  constructor(
    public readonly _id: Types.ObjectId,
    public readonly userId: Types.ObjectId,
    public readonly name: string,
    public readonly email: string,
    public readonly city: string,
    public readonly phone: string | null,
    public readonly avatarUrl: string | null,
    public readonly isActive: boolean,
    public readonly emailVerified: boolean,
    public readonly clinicName: string,
    public readonly clinicAddress: string,
    public readonly specialty: string | null,
    public readonly licenseNumber: string | null,
    public readonly yearsOfExperience: number | null,
    public readonly status: DoctorVerificationStatus | null,
    public readonly submittedAt: Date | null,
    public readonly verifiedAt: Date | null,
    public readonly verifiedBy: Types.ObjectId | null,
    public readonly rejectionReason: string | null,
    public readonly documents: LicenseDocumentEntity[],
    public readonly createdAt?: Date,
  ) {}
}

export const toAdminDoctorEntity = (doctor: AdminDoctorView): AdminDoctorEntity =>
  new AdminDoctorEntity(
    doctor._id,
    doctor.user._id,
    doctor.user.name,
    doctor.user.email,
    doctor.user.city,
    doctor.user.phone ?? null,
    doctor.user.avatarUrl ?? null,
    doctor.user.isActive !== false,
    !!doctor.user.emailVerifiedAt,
    doctor.clinicName,
    doctor.clinicAddress,
    doctor.specialty ?? null,
    doctor.licenseNumber ?? null,
    doctor.yearsOfExperience ?? null,
    doctor.verificationStatus ?? null,
    doctor.verificationSubmittedAt ?? null,
    doctor.verifiedAt ?? null,
    doctor.verifiedBy ?? null,
    doctor.rejectionReason ?? null,
    (doctor.licenseDocuments ?? []).map(toLicenseDocumentEntity),
    doctor.createdAt,
  );
