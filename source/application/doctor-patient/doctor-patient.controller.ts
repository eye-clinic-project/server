import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { DoctorPatientService } from './doctor-patient.service.js';
import { AssignmentQueryDto, CreateAssignmentDto, UpdateAssignmentDto } from './dto/doctor-patient.dto.js';
import { RateLimit } from '../../dependency/decorator/rate-limit.decorator.js';

@ApiTags('Doctor-Patient assignment')
@Controller('api/v1/doctor-patient')
@Auth()
export class DoctorPatientController {
  constructor(private readonly service: DoctorPatientService) {}

  @RateLimit.create()
  @Post()
  @ApiOperation({
    summary: "Assign a patient to a doctor",
    description: "Doctor: send patientId or patientEmail; the assignment is active immediately and the patient is notified (FR2.3). Patient: send doctorId to ask a doctor to follow them; it stays pending until the doctor accepts. Admin: send doctorId and patientId. Only active assignments give a doctor access to a patient.",
  })
  create(@User() user: HUserDocument, @Body() dto: CreateAssignmentDto) {
    return this.service.create(user, dto);
  }

  @Get()
  @ApiOperation({
    summary: "List my assignments",
    description: "Doctor: their patients. Patient: their doctors. Admin: all. Filter by status (pending, active, ended).",
  })
  list(@User() user: HUserDocument, @Query() query: AssignmentQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: "Get an assignment",
    description: "The doctor or patient in the assignment, or an admin.",
  })
  findOne(@User() user: HUserDocument, @Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: "Accept, end or annotate an assignment",
    description: "status = active accepts a pending request (doctor or admin only; the patient is notified). status = ended stops the doctor's access. Either side can update notes.",
  })
  update(
    @User() user: HUserDocument,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: "Remove an assignment",
    description: "The doctor or patient in the assignment, or an admin. The doctor loses access to the patient's data.",
  })
  remove(@User() user: HUserDocument, @Param('id', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }
}
