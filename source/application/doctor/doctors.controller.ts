import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { DoctorsService } from './doctors.service.js';
import { DoctorSearchQueryDto, UpdateDoctorDto } from './dto/doctor.dto.js';
import { PatientService } from '../patient/patient.service.js';
import { PatientSearchQueryDto } from '../patient/dto/patient.dto.js';
import { AppointmentService } from '../appointment/appointment.service.js';
import { AppointmentQueryDto } from '../appointment/dto/appointment.dto.js';

@ApiTags('Doctors')
@Controller('api/v1/doctors')
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly patientService: PatientService,
    private readonly appointmentService: AppointmentService,
  ) {}

  @Get('me')
  @Auth([SystemRoleEnum.DOCTOR])
  @ApiOperation({
    summary: "Get my doctor profile",
    description: "Doctor only. Account plus clinic profile.",
  })
  me(@User() user: HUserDocument) {
    return this.doctorsService.getById(user._id);
  }

  @Patch('me')
  @Auth([SystemRoleEnum.DOCTOR])
  @ApiOperation({
    summary: "Update my doctor profile",
    description: "Doctor only. Edits clinic name, address, specialty, license number, bio and experience. The first save creates the profile (clinicName and clinicAddress required), for example after Google sign-up.",
  })
  update(@User() user: HUserDocument, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.updateMe(user, dto);
  }

  @Get('me/dashboard')
  @Auth([SystemRoleEnum.DOCTOR])
  @ApiOperation({
    summary: "Doctor dashboard summary",
    description: "Doctor only. Counts of patients, pending patient requests, analyses, referable cases (Moderate and above), failed analyses, pending appointments and draft reports, plus today's appointments and the 5 latest analyses.",
  })
  dashboard(@User() user: HUserDocument) {
    return this.doctorsService.dashboard(user);
  }

  @Get()
  @Auth()
  @ApiOperation({
    summary: "Search doctors",
    description: "Any signed-in user. Lists active, verified doctors with their profile. Filter by `search` (name), `city` and `specialty`. Paginated with page and size.",
  })
  search(@Query() query: DoctorSearchQueryDto) {
    return this.doctorsService.search(query);
  }

  @Get(':doctorId')
  @Auth()
  @ApiOperation({
    summary: "Get a doctor",
    description: "Any signed-in user. Public doctor profile used when choosing or booking a doctor.",
  })
  findOne(@Param('doctorId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.doctorsService.getById(id);
  }

  @Get(':doctorId/patients')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  @ApiOperation({
    summary: "List a doctor's patients",
    description: "The doctor themself or an admin. Actively assigned patients with their profile and latest completed result. `search` matches name, email, patient ID (P-XXXXXX) or user id (FR2.2). Returns message \"No patients found\" when empty.",
  })
  patients(
    @User() user: HUserDocument,
    @Param('doctorId', ParseObjectIdPipe) id: Types.ObjectId,
    @Query() query: PatientSearchQueryDto,
  ) {
    this.doctorsService.assertSelfOrAdmin(user, id);
    return this.patientService.search(user, query, id);
  }

  @Get(':doctorId/appointments')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  @ApiOperation({
    summary: "List a doctor's appointments",
    description: "The doctor themself or an admin. Filter by status and date range (from, to).",
  })
  appointments(
    @User() user: HUserDocument,
    @Param('doctorId', ParseObjectIdPipe) id: Types.ObjectId,
    @Query() query: AppointmentQueryDto,
  ) {
    this.doctorsService.assertSelfOrAdmin(user, id);
    return this.appointmentService.list(user, { ...query, doctorId: id.toString() });
  }
}
