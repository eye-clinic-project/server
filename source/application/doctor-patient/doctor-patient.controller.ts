import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { DoctorPatientService } from './doctor-patient.service.js';
import { AssignmentQueryDto, CreateAssignmentDto, UpdateAssignmentDto } from './dto/doctor-patient.dto.js';

@ApiTags('Doctor-Patient assignment')
@Controller('api/v1/doctor-patient')
@Auth()
export class DoctorPatientController {
  constructor(private readonly service: DoctorPatientService) {}

  @Post()
  create(@User() user: HUserDocument, @Body() dto: CreateAssignmentDto) {
    return this.service.create(user, dto);
  }

  @Get()
  list(@User() user: HUserDocument, @Query() query: AssignmentQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':id')
  findOne(@User() user: HUserDocument, @Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Patch(':id')
  update(
    @User() user: HUserDocument,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  remove(@User() user: HUserDocument, @Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }
}
