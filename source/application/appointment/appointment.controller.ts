import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: "Book an appointment",
    description: "Patient: books a free slot with any doctor (status pending until the doctor confirms). Doctor: books for an assigned patient (send patientId; status confirmed). Send slotId, or doctorId + scheduledAt matching the start of a free slot (FR5.1). Double-booking is prevented: if the slot is taken, returns 409. The response includes a confirmation message and the other side is notified.",
  })
  create(@User() user: HUserDocument, @Body() dto: CreateAppointmentDto) {
    return this.service.create(user, dto);
  }

  @Get()
  @ApiOperation({
    summary: "List my appointments",
    description: "Doctor: theirs. Patient: theirs. Admin: all. Filter by status, from, to, doctorId and patientId.",
  })
  list(@User() user: HUserDocument, @Query() query: AppointmentQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':appointmentId')
  @ApiOperation({
    summary: "Get an appointment",
    description: "The doctor or patient of the appointment, or an admin.",
  })
  findOne(@User() user: HUserDocument, @Param('appointmentId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Patch(':appointmentId')
  @ApiOperation({
    summary: "Reschedule or edit an appointment",
    description: "The doctor or patient of the appointment (FR5.2). Send slotId or scheduledAt to move it to another free slot; the old slot is released. Moved by the patient: status pending again. Moved by the doctor: confirmed. The other side is notified.",
  })
  update(@User() user: HUserDocument, @Param('appointmentId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateAppointmentDto) {
    return this.service.update(user, id, dto);
  }

  @Patch(':appointmentId/confirm')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  @ApiOperation({
    summary: "Confirm an appointment",
    description: "The appointment's doctor or an admin (FR5.2). Pending to confirmed. The patient is notified.",
  })
  confirm(@User() user: HUserDocument, @Param('appointmentId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.confirm(user, id);
  }

  @Patch(':appointmentId/cancel')
  @ApiOperation({
    summary: "Cancel an appointment",
    description: "The doctor or patient of the appointment (FR5.2). Optional reason. The slot is released and the other side is notified.",
  })
  cancel(@User() user: HUserDocument, @Param('appointmentId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: CancelAppointmentDto) {
    return this.service.cancel(user, id, dto);
  }

  @Patch(':appointmentId/complete')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  @ApiOperation({
    summary: "Mark an appointment as completed",
    description: "The appointment's doctor or an admin.",
  })
  complete(@User() user: HUserDocument, @Param('appointmentId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.complete(user, id);
  }
}
