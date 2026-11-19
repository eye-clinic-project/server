export const DOCTOR_PATIENT_UNASSIGNED_EVENT = 'doctor.patient-unassigned';

export class DoctorPatientUnassignedEvent {
  constructor(
    public readonly doctorId: string,
    public readonly doctorName: string,
    public readonly patientUserId: string,
  ) {}
}
