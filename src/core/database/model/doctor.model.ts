import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IDoctor } from '../../../common/interface/database-schema.interface.js';

export type HDoctorDocument = HydratedDocument<IDoctor>;

@Schema({ timestamps: true, collection: 'doctors' })
export class Doctor {}

export const DoctorSchema = SchemaFactory.createForClass(Doctor);
