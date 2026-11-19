import { DoctorVerificationStatus } from '../../../dependencies/enum/index.js';

export const ADMIN_DOCTOR_DECIDED_EVENT = 'admin.doctor-decided';

export class AdminDoctorDecidedEvent {
  constructor(
    public readonly doctorProfileId: string,
    public readonly doctorUserId: string,
    public readonly adminId: string,
    public readonly status: DoctorVerificationStatus.APPROVED | DoctorVerificationStatus.REJECTED,
    public readonly reason: string | null,
  ) {}
}
