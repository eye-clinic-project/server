import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../../../common/enum/security.enum.js';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ type: String, enum: UserRole, required: true })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
