export const DOCTOR_LICENSE_SUBMITTED_EVENT = 'doctor.license-submitted';

export class DoctorLicenseSubmittedEvent {
  constructor(
    public readonly doctorId: string,
    public readonly doctorName: string,
    public readonly replacedKeys: string[],
  ) {}
}
