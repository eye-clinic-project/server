import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import type { Types } from 'mongoose';

import type { IUser } from '../../dependencies/interface/database.interface.js';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { AppointmentService } from './appointment.service.js';
import { AvailabilityRangeDto } from './dto/availability-range.dto.js';
import { BookAppointmentDto } from './dto/book-appointment.dto.js';
import { CancelRequestDto } from './dto/cancel-request.dto.js';
import { CreateAvailabilityDto } from './dto/create-availability.dto.js';
import { DaySlotsDto } from './dto/day-slots.dto.js';
import { DecideRequestDto } from './dto/decide-request.dto.js';
import { ListAppointmentsDto } from './dto/list-appointments.dto.js';
import { RescheduleRequestDto } from './dto/reschedule-request.dto.js';
import { AppointmentEntity } from './entity/appointment.entity.js';
import type { AppointmentPage } from './entity/appointment.type.js';
import { SlotEntity } from './entity/slot.entity.js';
import { Auth } from '../../dependencies/decorator/auth.decorator.js';
import { User } from '../../dependencies/decorator/user.decorator.js';
import { SystemRoleEnum } from '../../dependencies/enum/security.enum.js';

const { DOCTOR, PATIENT } = SystemRoleEnum;

@Controller('appointment')
@Auth()
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post('availability')
  @HttpCode(HttpStatus.CREATED)
  @Auth({ roles: [DOCTOR] })
  createAvailability(@User() user: IUser, @Body() body: CreateAvailabilityDto): Promise<SlotEntity[]> {
    return this.appointmentService.createAvailability(user, body);
  }

  @Get('availability/me')
  @Auth({ roles: [DOCTOR] })
  listMySlots(@User() user: IUser, @Query() query: AvailabilityRangeDto): Promise<SlotEntity[]> {
    return this.appointmentService.listMySlots(user, query);
  }

  @Delete('availability/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ roles: [DOCTOR] })
  deleteSlot(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<void> {
    return this.appointmentService.deleteSlot(user, id);
  }

  @Get('doctors/:doctorId/slots')
  @Auth({ roles: [PATIENT] })
  listFreeSlots(@User() user: IUser, @Param('doctorId', ParseObjectIdPipe) doctorId: Types.ObjectId, @Query() query: DaySlotsDto): Promise<SlotEntity[]> {
    return this.appointmentService.listFreeSlots(user, doctorId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ roles: [PATIENT] })
  book(@User() user: IUser, @Body() body: BookAppointmentDto): Promise<AppointmentEntity> {
    return this.appointmentService.book(user, body);
  }

  @Get('me')
  @Auth({ roles: [DOCTOR, PATIENT] })
  list(@User() user: IUser, @Query() query: ListAppointmentsDto): Promise<AppointmentPage> {
    return this.appointmentService.list(user, query);
  }

  @Get(':id')
  @Auth({ roles: [DOCTOR, PATIENT] })
  findOne(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<AppointmentEntity> {
    return this.appointmentService.findOne(user, id);
  }

  @Post(':id/cancel-request')
  @HttpCode(HttpStatus.OK)
  @Auth({ roles: [PATIENT] })
  requestCancel(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() body: CancelRequestDto): Promise<AppointmentEntity> {
    return this.appointmentService.requestCancel(user, id, body);
  }

  @Post(':id/reschedule-request')
  @HttpCode(HttpStatus.OK)
  @Auth({ roles: [PATIENT] })
  requestReschedule(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() body: RescheduleRequestDto): Promise<AppointmentEntity> {
    return this.appointmentService.requestReschedule(user, id, body);
  }

  @Delete(':id/request')
  @HttpCode(HttpStatus.OK)
  @Auth({ roles: [PATIENT] })
  withdrawRequest(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<AppointmentEntity> {
    return this.appointmentService.withdrawRequest(user, id);
  }

  @Post(':id/request/approve')
  @HttpCode(HttpStatus.OK)
  @Auth({ roles: [DOCTOR] })
  approveRequest(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() body: DecideRequestDto): Promise<AppointmentEntity> {
    return this.appointmentService.decideRequest(user, id, true, body);
  }

  @Post(':id/request/reject')
  @HttpCode(HttpStatus.OK)
  @Auth({ roles: [DOCTOR] })
  rejectRequest(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() body: DecideRequestDto): Promise<AppointmentEntity> {
    return this.appointmentService.decideRequest(user, id, false, body);
  }
}
