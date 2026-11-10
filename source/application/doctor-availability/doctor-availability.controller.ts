import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { DoctorAvailabilityService } from './doctor-availability.service.js';
import { AvailabilityQueryDto, CreateAvailabilityDto, UpdateAvailabilityDto } from './dto/availability.dto.js';
import { RateLimit } from '../../dependency/decorator/rate-limit.decorator.js';

@ApiTags('Doctor availability')
@Controller('api/v1/doctor-availability')
@Auth()
export class DoctorAvailabilityController {
  constructor(private readonly service: DoctorAvailabilityService) {}

  @RateLimit.create()
  @Post()
  @Auth([SystemRoleEnum.DOCTOR])
  @ApiOperation({
    summary: 'Add available time',
    description:
      'Doctor only. Adds one slot (startAt to endAt) or, with slotMinutes, splits the range into slots (up to 200). Times must be in the future and must not overlap existing slots.',
  })
  create(@User() user: HUserDocument, @Body() dto: CreateAvailabilityDto) {
    return this.service.create(user, dto);
  }

  @Get()
  @ApiOperation({
    summary: "List a doctor's slots",
    description:
      'Any signed-in user. Send doctorId (doctors can omit it for their own). Patients see only free future slots; the doctor also sees booked ones. Filter by from, to and onlyAvailable.',
  })
  list(@User() user: HUserDocument, @Query() query: AvailabilityQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':slotId')
  @ApiOperation({
    summary: 'Get a slot',
    description: 'Any signed-in user.',
  })
  findOne(@Param('slotId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(id);
  }

  @Patch(':slotId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  @ApiOperation({
    summary: 'Change a slot',
    description: "The slot's doctor or an admin. Booked slots cannot be changed (409); reschedule the appointment instead.",
  })
  update(@User() user: HUserDocument, @Param('slotId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateAvailabilityDto) {
    return this.service.update(user, id, dto);
  }

  @Delete(':slotId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  @ApiOperation({
    summary: 'Delete a slot',
    description: "The slot's doctor or an admin. Booked slots cannot be deleted (409).",
  })
  remove(@User() user: HUserDocument, @Param('slotId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }
}
