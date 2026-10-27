import { Field, ID, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { NotificationType } from '../../common/enum/schema.enum.js';

registerEnumType(NotificationType, { name: 'NotificationType' });

@ObjectType('Notification')
export class NotificationGraphqlType {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  recipientId!: string;

  @Field()
  title!: string;

  @Field()
  body!: string;

  @Field()
  read!: boolean;

  @Field(() => NotificationType)
  type!: NotificationType;

  @Field(() => Date, { nullable: true })
  createdAt!: Date | null;

  @Field(() => Date, { nullable: true })
  updatedAt!: Date | null;
}

@InputType()
export class SendNotificationInput {
  @Field(() => ID)
  @IsMongoId()
  recipientId!: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @Field()
  @IsString()
  @MinLength(1)
  @MaxLength(2_000)
  body!: string;

  @Field(() => NotificationType, { nullable: true })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}

@ObjectType('MarkNotificationsReadResult')
export class MarkNotificationsReadResult {
  @Field(() => Int)
  modifiedCount!: number;
}

@ObjectType('DeleteNotificationResult')
export class DeleteNotificationResult {
  @Field()
  deleted!: boolean;
}
