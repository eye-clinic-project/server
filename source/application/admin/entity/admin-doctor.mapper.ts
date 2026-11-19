import type { AdminDoctorView } from './admin.type.js';
import { AdminDoctorEntity } from './admin-doctor.entity.js';
import { toLicenseDocumentEntity } from '../../doctor/entity/index.js';

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
