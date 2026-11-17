import { SetMetadata } from '@nestjs/common';

export const allowPendingDoctorName = 'ALLOW_PENDING_DOCTOR';
export const AllowPendingDoctor = () => SetMetadata(allowPendingDoctorName, true);
