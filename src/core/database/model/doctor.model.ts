import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DoctorDocument = HydratedDocument<Doctor>;

@Schema({ timestamps: true, collection: 'doctors' })
export class Doctor {

}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);