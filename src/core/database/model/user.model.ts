import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRole } from '../../../common/enum/user.enum.js';



export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ type: String, enum: UserRole, required: true })
  role: UserRole;

  @Prop({ type: Date })
  changeCredentialsTime?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);