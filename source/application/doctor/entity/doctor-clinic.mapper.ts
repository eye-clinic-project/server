import type { DoctorClinicView } from './doctor.type.js';
import { DoctorClinicEntity } from './doctor-clinic.entity.js';

export const toDoctorClinicEntity = (doctor: DoctorClinicView): DoctorClinicEntity =>
  new DoctorClinicEntity(
    doctor._id,
    doctor.user,
    doctor.clinicName,
    doctor.clinicAddress,
    doctor.specialty ?? null,
    doctor.licenseNumber ?? null,
    doctor.bio ?? null,
    doctor.yearsOfExperience ?? null,
    doctor.verificationStatus ?? null,
    doctor.createdAt,
    doctor.updatedAt,
  );
