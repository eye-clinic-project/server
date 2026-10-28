// import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
// import { Auth } from '../../common/decorator/auth.decorator.js';
// import { User } from '../../common/decorator/user.decorator.js';
// import { UserRoleEnum } from '../../common/enum/security.enum.js';
// import type { HUserDocument } from '../../core/database/model/user.model.js';
// import { GraphQL_JSON } from '../../common/gql/json.scalar.js';
// import { validateGraphqlInput } from '../../common/gql/validate-graphql-input.js';
// import { AppointmentService } from './appointment.service.js';
// import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
// import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

// @Resolver()
// export class AppointmentResolver {
//   constructor(private readonly appointments: AppointmentService) {}

//   @Mutation(() => GraphQL_JSON)
//   @Auth([UserRoleEnum.PATIENT])
//   async createAppointment(
//     @User() user: HUserDocument,
//     @Args('input', { type: () => GraphQL_JSON }) input: CreateAppointmentDto,
//   ) {
//     return this.appointments.create(
//       user._id.toString(),
//       await validateGraphqlInput(input, CreateAppointmentDto),
//     );
//   }

//   @Query(() => GraphQL_JSON, { name: 'myAppointments' })
//   @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
//   findMine(@User() user: HUserDocument) {
//     return this.appointments.findAll(user._id.toString());
//   }

//   @Query(() => GraphQL_JSON, { name: 'myUpcomingAppointments' })
//   @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
//   findUpcoming(@User() user: HUserDocument) {
//     return this.appointments.findUpcoming(user._id.toString(), user.role);
//   }

//   @Query(() => GraphQL_JSON, { name: 'appointment' })
//   @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
//   findOne(
//     @User() user: HUserDocument,
//     @Args('appointmentId', { type: () => ID }) appointmentId: string,
//   ) {
//     return this.appointments.findOne(user._id.toString(), appointmentId);
//   }

//   @Mutation(() => GraphQL_JSON)
//   @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
//   async rescheduleAppointment(
//     @User() user: HUserDocument,
//     @Args('appointmentId', { type: () => ID }) appointmentId: string,
//     @Args('input', { type: () => GraphQL_JSON }) input: UpdateAppointmentDto,
//   ) {
//     return this.appointments.reschedule(
//       user._id.toString(),
//       appointmentId,
//       await validateGraphqlInput(input, UpdateAppointmentDto),
//     );
//   }

//   @Mutation(() => GraphQL_JSON)
//   @Auth([UserRoleEnum.DOCTOR])
//   confirmAppointment(
//     @User() user: HUserDocument,
//     @Args('appointmentId', { type: () => ID }) appointmentId: string,
//   ) {
//     return this.appointments.confirm(user._id.toString(), appointmentId);
//   }

//   @Mutation(() => GraphQL_JSON)
//   @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
//   cancelAppointment(
//     @User() user: HUserDocument,
//     @Args('appointmentId', { type: () => ID }) appointmentId: string,
//   ) {
//     return this.appointments.cancel(
//       user._id.toString(),
//       user.role,
//       appointmentId,
//     );
//   }
// }
