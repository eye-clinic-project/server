import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserRoleEnum } from '../../../common/enum/security.enum.js';
import { IUser } from '../../../common/interface/database-schema.interface.js';

export type HUserDocument = HydratedDocument<IUser>;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    required: true,
    select: false,
  })
  passwordHash: string;

  @Prop({
    required: true,
    trim: true,
  })
  city: string;

  @Prop({
    required: true,
    enum: Object.values(UserRoleEnum),
    type: String,
  })
  role: UserRoleEnum;
}

export const UserSchema = SchemaFactory.createForClass(User);
