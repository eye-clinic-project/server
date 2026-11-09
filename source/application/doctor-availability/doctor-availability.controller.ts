import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { DoctorAvailabilityService } from './doctor-availability.service.js';
import { AvailabilityQueryDto, CreateAvailabilityDto, UpdateAvailabilityDto } from './dto/availability.dto.js';

@ApiTags('Doctor availability')
@Controller('api/v1/doctor-availability')
@Auth()
export class DoctorAvailabilityController {
  constructor(private readonly service: DoctorAvailabilityService) {}

  @Post()
  @Auth([SystemRoleEnum.DOCTOR])
  create(@User() user: HUserDocument, @Body() dto: CreateAvailabilityDto) {
    return this.service.create(user, dto);
  }

  @Get()
  list(@User() user: HUserDocument, @Query() query: AvailabilityQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':slotId')
  findOne(@Param('slotId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(id);
  }

  @Patch(':slotId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  update(@User() user: HUserDocument, @Param('slotId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateAvailabilityDto) {
    return this.service.update(user, id, dto);
  }

  @Delete(':slotId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  remove(@User() user: HUserDocument, @Param('slotId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }
}
