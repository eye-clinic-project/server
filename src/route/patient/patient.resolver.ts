import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { GraphQL_JSON } from '../../common/graphql/json.scalar.js';
import { validateGraphqlInput } from '../../common/graphql/validate-graphql-input.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import { UpdatePatientDto } from './dto/update-patient.dto.js';
import { PatientService } from './patient.service.js';

@Resolver()
@Auth([UserRoleEnum.PATIENT])
export class PatientResolver {
  constructor(private readonly patients: PatientService) {}

  @Query(() => GraphQL_JSON, { name: 'myPatientProfile' })
  findMyProfile(@User() user: HUserDocument) {
    return this.patients.findProfile(user._id);
  }

  @Mutation(() => GraphQL_JSON)
  async createPatientProfile(
    @User() user: HUserDocument,
    @Args('input', { type: () => GraphQL_JSON }) input: CreatePatientDto,
  ) {
    return this.patients.createProfile(
      user._id,
      await validateGraphqlInput(input, CreatePatientDto),
    );
  }

  @Mutation(() => GraphQL_JSON)
  async updatePatientProfile(
    @User() user: HUserDocument,
    @Args('input', { type: () => GraphQL_JSON }) input: UpdatePatientDto,
  ) {
    return this.patients.updateProfile(
      user._id,
      await validateGraphqlInput(input, UpdatePatientDto),
    );
  }

  @Query(() => GraphQL_JSON, { name: 'myPatientMedicalRecords' })
  getMyMedicalRecords(@User() user: HUserDocument) {
    return this.patients.getMedicalRecords(user._id);
  }
}