import {
  Field,
  ID,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRoleEnum } from '../../../common/enum/security.enum.js';

registerEnumType(UserRoleEnum, { name: 'UserRole' });

@ObjectType('UserProfile')
export class UserProfileGraphqlType {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field()
  city!: string;

  @Field(() => UserRoleEnum)
  role!: UserRoleEnum;

  @Field({ nullable: true })
  avatarUrl!: string | null;

  @Field({ nullable: true })
  createdAt!: Date | null;

  @Field({ nullable: true })
  updatedAt!: Date | null;
}

@InputType()
export class UpdateMyProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  city?: string;
}
