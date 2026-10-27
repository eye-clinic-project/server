import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { GraphQLJSON } from '../../common/graphql/json.scalar.js';
import { validateGraphqlInput } from '../../common/graphql/validate-graphql-input.js';
import { AppointmentService } from './appointment.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

@Resolver()
export class AppointmentResolver {
  constructor(private readonly appointments: AppointmentService) {}

  @Mutation(() => GraphQLJSON)
  @Auth([UserRoleEnum.PATIENT])
  async createAppointment(
    @User() user: HUserDocument,
    @Args('input', { type: () => GraphQLJSON }) input: CreateAppointmentDto,
  ) {
    return this.appointments.create(
      user._id.toString(),
      await validateGraphqlInput(input, CreateAppointmentDto),
    );
  }

  @Query(() => GraphQLJSON, { name: 'myAppointments' })
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  findMine(@User() user: HUserDocument) {
    return this.appointments.findAll(user._id.toString());
  }

  @Query(() => GraphQLJSON, { name: 'myUpcomingAppointments' })
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  findUpcoming(@User() user: HUserDocument) {
    return this.appointments.findUpcoming(user._id.toString(), user.role);
  }

  @Query(() => GraphQLJSON, { name: 'appointment' })
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  findOne(
    @User() user: HUserDocument,
    @Args('appointmentId', { type: () => ID }) appointmentId: string,
  ) {
    return this.appointments.findOne(user._id.toString(), appointmentId);
  }

  @Mutation(() => GraphQLJSON)
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  async rescheduleAppointment(
    @User() user: HUserDocument,
    @Args('appointmentId', { type: () => ID }) appointmentId: string,
    @Args('input', { type: () => GraphQLJSON }) input: UpdateAppointmentDto,
  ) {
    return this.appointments.reschedule(
      user._id.toString(),
      appointmentId,
      await validateGraphqlInput(input, UpdateAppointmentDto),
    );
  }

  @Mutation(() => GraphQLJSON)
  @Auth([UserRoleEnum.DOCTOR])
  confirmAppointment(
    @User() user: HUserDocument,
    @Args('appointmentId', { type: () => ID }) appointmentId: string,
  ) {
    return this.appointments.confirm(user._id.toString(), appointmentId);
  }

  @Mutation(() => GraphQLJSON)
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  cancelAppointment(
    @User() user: HUserDocument,
    @Args('appointmentId', { type: () => ID }) appointmentId: string,
  ) {
    return this.appointments.cancel(
      user._id.toString(),
      user.role,
      appointmentId,
    );
  }
}