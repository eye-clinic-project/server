import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  me(@User() user: HUserDocument) {
    return this.doctorsService.getById(user._id);
  }

  @Patch('me')
  @Auth([SystemRoleEnum.DOCTOR])
  update(@User() user: HUserDocument, @Body() dto: UpdateDoctorDto) {
    return this.doctorsService.updateMe(user, dto);
  }

  @Get('me/dashboard')
  @Auth([SystemRoleEnum.DOCTOR])
  dashboard(@User() user: HUserDocument) {
    return this.doctorsService.dashboard(user);
  }

  @Get()
  @Auth()
  search(@Query() query: DoctorSearchQueryDto) {
    return this.doctorsService.search(query);
  }

  @Get(':doctorId')
  @Auth()
  findOne(@Param('doctorId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.doctorsService.getById(id);
  }

  @Get(':doctorId/patients')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
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
  appointments(
    @User() user: HUserDocument,
    @Param('doctorId', ParseObjectIdPipe) id: Types.ObjectId,
    @Query() query: AppointmentQueryDto,
  ) {
    this.doctorsService.assertSelfOrAdmin(user, id);
    return this.appointmentService.list(user, { ...query, doctorId: id.toString() });
  }
}
