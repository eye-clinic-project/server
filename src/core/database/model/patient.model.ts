import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PatientDocument = HydratedDocument<Patient>;

@Schema({ timestamps: true, collection: 'patients' })
export class Patient {

}

export const PatientSchema = SchemaFactory.createForClass(Patient);
PatientSchema.index({ fullName: 'text' }); 