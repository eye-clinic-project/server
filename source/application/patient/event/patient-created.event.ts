export const PATIENT_CREATED_EVENT = 'patient.created';

export class PatientCreatedEvent {
  constructor(
    public readonly patientId: string,
    public readonly patientUserId: string,
    public readonly createdBy: string,
    public readonly assignedDoctor: { id: string; name: string } | null,
  ) {}
}
