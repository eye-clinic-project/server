import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from './user.model.js';
import { IDevice } from '../../dependency/interface/database-schema.interface.js';
import { DeviceStatus } from '../../dependency/enum/database.enum.js';

export type HDeviceDocument = HydratedDocument<IDevice>;

/** A fundus camera registered to a doctor (FR7.1). Authenticates with an API key. */
@Schema({ timestamps: true, collection: 'devices' })
export class Device {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, unique: true })
  serialNumber: string;

  @Prop({ trim: true })
  model?: string;

  @Prop({ trim: true })
  location?: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  owner: Types.ObjectId;

  @Prop({ type: String, required: true, select: false })
  apiKeyHash: string;

  /** First characters of the key, used to look the device up. */
  @Prop({ type: String, required: true, unique: true })
  apiKeyPrefix: string;

  @Prop({ type: String, enum: Object.values(DeviceStatus), default: DeviceStatus.ACTIVE })
  status: DeviceStatus;

  @Prop({ type: Date, default: null })
  lastSeenAt?: Date | null;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
