import { HPatientDocument } from '../../../../database/model/index.js';

export type PatientProfileData = Partial<Pick<HPatientDocument, 'dateOfBirth' | 'gender' | 'emergencyContact' | 'diabetesSince' | 'medicalNotes'>>;
