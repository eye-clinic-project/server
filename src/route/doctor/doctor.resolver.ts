import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { GraphQL_JSON } from '../../common/graphql/json.scalar.js';
import { validateGraphqlInput } from '../../common/graphql/validate-graphql-input.js';
import { DoctorService } from './doctor.service.js';
import { CreateDoctorDto } from './dto/create-doctor.dto.js';
import { UpdateDoctorDto } from './dto/update-doctor.dto.js';

@Resolver()
export class DoctorResolver {
  constructor(private readonly doctors: DoctorService) {}

  @Query(() => GraphQL_JSON, { name: 'doctors' })
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  findAll() {
    return this.doctors.findAll();
  }

  @Query(() => GraphQL_JSON, { name: 'myDoctorProfile' })
  @Auth([UserRoleEnum.DOCTOR])
  findMyProfile(@User() user: HUserDocument) {
    return this.doctors.findProfile(user._id.toString());
  }

  @Query(() => GraphQL_JSON, { name: 'doctorProfile' })
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  findProfile(@Args('doctorId', { type: () => ID }) doctorId: string) {
    return this.doctors.findProfile(doctorId);
  }

  @Mutation(() => GraphQL_JSON)
  @Auth([UserRoleEnum.DOCTOR])
  async createDoctorProfile(
    @User() user: HUserDocument,
    @Args('input', { type: () => GraphQL_JSON }) input: CreateDoctorDto,
  ) {
    return this.doctors.createProfile(
      user._id.toString(),
      await validateGraphqlInput(input, CreateDoctorDto),
    );
  }

  @Mutation(() => GraphQL_JSON)
  @Auth([UserRoleEnum.DOCTOR])
  async updateDoctorProfile(
    @User() user: HUserDocument,
    @Args('input', { type: () => GraphQL_JSON }) input: UpdateDoctorDto,
  ) {
    return this.doctors.updateProfile(
      user._id.toString(),
      await validateGraphqlInput(input, UpdateDoctorDto),
    );
  }

  @Query(() => GraphQL_JSON, { name: 'myAssignedPatients' })
  @Auth([UserRoleEnum.DOCTOR])
  findAssignedPatients(@User() user: HUserDocument) {
    return this.doctors.findAssignedPatients(user._id.toString());
  }

  @Mutation(() => GraphQL_JSON)
  @Auth([UserRoleEnum.DOCTOR])
  assignPatient(
    @User() user: HUserDocument,
    @Args('patientId', { type: () => ID }) patientId: string,
  ) {
    return this.doctors.assignPatient(user._id.toString(), patientId);
  }

  @Mutation(() => GraphQL_JSON)
  @Auth([UserRoleEnum.DOCTOR])
  unassignPatient(
    @User() user: HUserDocument,
    @Args('patientId', { type: () => ID }) patientId: string,
  ) {
    return this.doctors.unassignPatient(user._id.toString(), patientId);
  }

  @Query(() => GraphQL_JSON, { name: 'assignedPatientRecords' })
  @Auth([UserRoleEnum.DOCTOR])
  getPatientRecords(
    @User() user: HUserDocument,
    @Args('patientId', { type: () => ID }) patientId: string,
  ) {
    return this.doctors.getAssignedPatientRecords(
      user._id.toString(),
      patientId,
    );
  }

  @Query(() => GraphQL_JSON, { name: 'myDoctorAppointments' })
  @Auth([UserRoleEnum.DOCTOR])
  getAppointments(@User() user: HUserDocument) {
    return this.doctors.getDoctorAppointments(user._id.toString());
  }
}