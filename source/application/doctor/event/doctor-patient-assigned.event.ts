export const DOCTOR_PATIENT_ASSIGNED_EVENT = 'doctor.patient-assigned';

export class DoctorPatientAssignedEvent {
  constructor(
    public readonly doctorId: string,
    public readonly doctorName: string,
    public readonly patientUserId: string,
  ) {}
}
