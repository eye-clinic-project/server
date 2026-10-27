import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IPatient } from '../../../common/interface/database-schema.interface.js';

export type HPatientDocument = HydratedDocument<IPatient>;

@Schema({ timestamps: true, collection: 'patients' })
export class Patient {}

export const PatientSchema = SchemaFactory.createForClass(Patient);
PatientSchema.index({ fullName: 'text' });
