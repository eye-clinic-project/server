import { HPatientDocument } from '../../../../database/model/patient.model.js';

export type PatientProfileData = Partial<Pick<HPatientDocument, 'dateOfBirth' | 'gender' | 'emergencyContact' | 'diabetesSince' | 'medicalNotes'>>;
