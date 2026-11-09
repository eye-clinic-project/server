import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { AppointmentService } from './appointment.service.js';
import {
  AppointmentQueryDto,
  CancelAppointmentDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './dto/appointment.dto.js';

@ApiTags('Appointments')
@Controller('api/v1/appointments')
@Auth()
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

  @Post()
  create(@User() user: HUserDocument, @Body() dto: CreateAppointmentDto) {
    return this.service.create(user, dto);
  }

  @Get()
  list(@User() user: HUserDocument, @Query() query: AppointmentQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':appointmentId')
  findOne(@User() user: HUserDocument, @Param('appointmentId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Patch(':appointmentId')
  update(@User() user: HUserDocument, @Param('appointmentId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateAppointmentDto) {
    return this.service.update(user, id, dto);
  }

  @Patch(':appointmentId/confirm')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  confirm(@User() user: HUserDocument, @Param('appointmentId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.confirm(user, id);
  }

  @Patch(':appointmentId/cancel')
  cancel(@User() user: HUserDocument, @Param('appointmentId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: CancelAppointmentDto) {
    return this.service.cancel(user, id, dto);
  }

  @Patch(':appointmentId/complete')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  complete(@User() user: HUserDocument, @Param('appointmentId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.complete(user, id);
  }
}
