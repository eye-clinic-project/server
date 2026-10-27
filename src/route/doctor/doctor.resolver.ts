import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { GraphQLJSON } from '../../common/graphql/json.scalar.js';
import { DoctorService } from './doctor.service.js';
import { CreateDoctorDto } from './dto/create-doctor.dto.js';
import { UpdateDoctorDto } from './dto/update-doctor.dto.js';

@Resolver()
export class DoctorResolver {
  constructor(private readonly doctors: DoctorService) {}

  @Query(() => GraphQLJSON, { name: 'doctors' })
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  findAll() {
    return this.doctors.findAll();
  }

  @Query(() => GraphQLJSON, { name: 'myDoctorProfile' })
  @Auth([UserRoleEnum.DOCTOR])
  findMyProfile(@User() user: HUserDocument) {
    return this.doctors.findProfile(user._id.toString());
  }

  @Query(() => GraphQLJSON, { name: 'doctorProfile' })
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  findProfile(@Args('doctorId', { type: () => ID }) doctorId: string) {
    return this.doctors.findProfile(doctorId);
  }

  @Mutation(() => GraphQLJSON)
  @Auth([UserRoleEnum.DOCTOR])
  createDoctorProfile(
    @User() user: HUserDocument,
    @Args('input', { type: () => GraphQLJSON }) input: CreateDoctorDto,
  ) {
    return this.doctors.createProfile(user._id.toString(), input);
  }

  @Mutation(() => GraphQLJSON)
  @Auth([UserRoleEnum.DOCTOR])
  updateDoctorProfile(
    @User() user: HUserDocument,
    @Args('input', { type: () => GraphQLJSON }) input: UpdateDoctorDto,
  ) {
    return this.doctors.updateProfile(user._id.toString(), input);
  }

  @Query(() => GraphQLJSON, { name: 'myAssignedPatients' })
  @Auth([UserRoleEnum.DOCTOR])
  findAssignedPatients(@User() user: HUserDocument) {
    return this.doctors.findAssignedPatients(user._id.toString());
  }

  @Mutation(() => GraphQLJSON)
  @Auth([UserRoleEnum.DOCTOR])
  assignPatient(
    @User() user: HUserDocument,
    @Args('patientId', { type: () => ID }) patientId: string,
  ) {
    return this.doctors.assignPatient(user._id.toString(), patientId);
  }

  @Mutation(() => GraphQLJSON)
  @Auth([UserRoleEnum.DOCTOR])
  unassignPatient(
    @User() user: HUserDocument,
    @Args('patientId', { type: () => ID }) patientId: string,
  ) {
    return this.doctors.unassignPatient(user._id.toString(), patientId);
  }

  @Query(() => GraphQLJSON, { name: 'assignedPatientRecords' })
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

  @Query(() => GraphQLJSON, { name: 'myDoctorAppointments' })
  @Auth([UserRoleEnum.DOCTOR])
  getAppointments(@User() user: HUserDocument) {
    return this.doctors.getDoctorAppointments(user._id.toString());
  }
}