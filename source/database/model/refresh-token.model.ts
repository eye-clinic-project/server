import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

import type { IRefreshToken, IRefreshTokenRevocation } from '../../dependencies/interface/database.interface.js';

export type HRefreshTokenDocument = HydratedDocument<IRefreshToken>;
export type HRefreshTokenRevocationDocument = HydratedDocument<IRefreshTokenRevocation>;

@Schema({ collection: 'refresh_tokens' })
export class RefreshToken {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: String, required: true, index: true })
  familyId: string;

  @Prop({ type: String, required: true, index: true })
  userId: string;

  @Prop({ type: Date, required: true })
  createdAt: Date;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: Date, required: true })
  familyExpiresAt: Date;

  @Prop({ type: Date, default: null })
  usedAt?: Date | null;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  claims?: Record<string, unknown> | null;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
RefreshTokenSchema.index({ familyExpiresAt: 1 }, { expireAfterSeconds: 0 });

@Schema({ collection: 'refresh_token_revocations' })
export class RefreshTokenRevocation {
  @Prop({ type: String, required: true })
  _id: string;

  @Prop({ type: Date, required: true })
  revokedAt: Date;

  @Prop({ type: Date, required: true })
  familyExpiresAt: Date;
}

export const RefreshTokenRevocationSchema = SchemaFactory.createForClass(RefreshTokenRevocation);
RefreshTokenRevocationSchema.index({ familyExpiresAt: 1 }, { expireAfterSeconds: 0 });
