import type { AssignedDoctorView } from './patient.type.js';
import { AssignedDoctorEntity } from './assigned-doctor.entity.js';

export const toAssignedDoctorEntity = ({ _id, assignedAt, doctor, profile }: AssignedDoctorView): AssignedDoctorEntity =>
  new AssignedDoctorEntity(
    _id,
    assignedAt ?? null,
    doctor._id,
    doctor.name,
    doctor.email,
    doctor.city,
    doctor.phone ?? null,
    doctor.avatarUrl ?? null,
    profile?.clinicName ?? null,
    profile?.clinicAddress ?? null,
    profile?.specialty ?? null,
    profile?.bio ?? null,
    profile?.yearsOfExperience ?? null,
    profile?.verificationStatus ?? null,
  );
