import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { AppointmentService } from './appointment.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

@Controller('appointment')
@ApiTags('Appointments')
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  @Auth([UserRoleEnum.PATIENT])
  create(
    @User() user: HUserDocument,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ) {
    return this.appointmentService.create(
      user._id.toString(),
      createAppointmentDto,
    );
  }

  @Get()
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  findAll(@User() user: HUserDocument) {
    return this.appointmentService.findAll(user._id.toString());
  }

  @Get('upcoming')
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  findUpcoming(@User() user: HUserDocument) {
    return this.appointmentService.findUpcoming(user._id.toString(), user.role);
  }

  @Get(':appointmentId')
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  findOne(
    @User() user: HUserDocument,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.appointmentService.findOne(user._id.toString(), appointmentId);
  }

  @Patch(':appointmentId/reschedule')
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  reschedule(
    @User() user: HUserDocument,
    @Param('appointmentId') appointmentId: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ) {
    return this.appointmentService.reschedule(
      user._id.toString(),
      appointmentId,
      updateAppointmentDto,
    );
  }

  @Patch(':appointmentId/confirm')
  @Auth([UserRoleEnum.DOCTOR])
  confirm(
    @User() user: HUserDocument,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.appointmentService.confirm(user._id.toString(), appointmentId);
  }

  @Patch(':appointmentId/cancel')
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  cancel(
    @User() user: HUserDocument,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.appointmentService.cancel(
      user._id.toString(),
      user.role,
      appointmentId,
    );
  }

  @Delete(':appointmentId')
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  remove(
    @User() user: HUserDocument,
    @Param('appointmentId') appointmentId: string,
  ) {
    return this.appointmentService.remove(
      user._id.toString(),
      user.role,
      appointmentId,
    );
  }
}
