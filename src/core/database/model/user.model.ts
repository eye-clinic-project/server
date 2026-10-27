import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRoleEnum } from '../../../common/enum/security.enum.js';
import { IUser } from '../../../common/interface/database-schema.interface.js';

export type HUserDocument = HydratedDocument<IUser>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ type: String, enum: UserRoleEnum, required: true })
  role: UserRoleEnum;
}

export const UserSchema = SchemaFactory.createForClass(User);
