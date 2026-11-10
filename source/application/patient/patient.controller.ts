import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { PaginationQueryDto } from '../../dependency/dto/pagination.dto.js';
import { PatientService } from './patient.service.js';
import { CreatePatientDto, DoctorUpdatePatientDto, PatientSearchQueryDto, UpdatePatientProfileDto } from './dto/patient.dto.js';
import { AnalysisService } from '../analysis/analysis.service.js';
import { ReportService } from '../report/report.service.js';
import { RateLimit } from '../../dependency/decorator/rate-limit.decorator.js';

@ApiTags('Patients')
@Controller('api/v1/patients')
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly analysisService: AnalysisService,
    private readonly reportService: ReportService,
  ) {}

  @RateLimit.create()
  @Post()
  @Auth([SystemRoleEnum.DOCTOR])
  @ApiOperation({
    summary: 'Create a patient',
    description:
      'Doctor only (FR2.1). Creates the patient account and record and assigns the patient to this doctor. Required: name, email, city, dateOfBirth, gender. Missing or invalid fields return 400 with validation messages. By default the patient is emailed a link to set their password. An existing email returns 409; assign that patient with POST /doctor-patient instead.',
  })
  create(@User() user: HUserDocument, @Body() dto: CreatePatientDto) {
    return this.patientService.create(user, dto);
  }

  @RateLimit.search()
  @Get()
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  @ApiOperation({
    summary: 'Search patients',
    description:
      'Doctor (only their actively assigned patients) or admin (everyone). `search` matches name, email, patient ID (P-XXXXXX) or user id (FR2.2). Each row includes the latest completed result. Returns message "No patients found" when empty.',
  })
  search(@User() user: HUserDocument, @Query() query: PatientSearchQueryDto) {
    return this.patientService.search(user, query);
  }

  @Get('me')
  @Auth([SystemRoleEnum.PATIENT])
  @ApiOperation({
    summary: 'Get my patient profile',
    description: 'Patient only. Account plus patient record (patient ID, date of birth, gender, diabetes details).',
  })
  me(@User() user: HUserDocument) {
    return this.patientService.getMe(user);
  }

  @Patch('me')
  @Auth([SystemRoleEnum.PATIENT])
  @ApiOperation({
    summary: 'Update my patient profile',
    description: 'Patient only. Edits date of birth, gender, emergency contact and diabetes details. Medical notes can only be edited by the doctor.',
  })
  updateMe(@User() user: HUserDocument, @Body() dto: UpdatePatientProfileDto) {
    return this.patientService.updateMe(user, dto);
  }

  @Get(':patientId')
  @Auth()
  @ApiOperation({
    summary: 'Get a patient record',
    description:
      'The patient, an assigned doctor or an admin (FR2.4). Full record plus counts of images, analyses, reports and upcoming appointments. A doctor who is not assigned gets 403.',
  })
  findOne(@User() user: HUserDocument, @Param('patientId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.patientService.getRecord(user, id);
  }

  @Patch(':patientId')
  @Auth([SystemRoleEnum.DOCTOR])
  @ApiOperation({
    summary: 'Update a patient record',
    description: "Assigned doctor only. Edits the patient's profile and medical notes.",
  })
  update(@User() user: HUserDocument, @Param('patientId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: DoctorUpdatePatientDto) {
    return this.patientService.updateByDoctor(user, id, dto);
  }

  @Get(':patientId/doctors')
  @Auth()
  @ApiOperation({
    summary: "List a patient's doctors",
    description: "The patient, an assigned doctor or an admin. Active and pending doctor assignments with each doctor's profile.",
  })
  doctors(@User() user: HUserDocument, @Param('patientId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.patientService.doctorsOf(user, id);
  }

  @Get(':patientId/history')
  @Auth()
  @ApiOperation({
    summary: 'Patient history timeline',
    description:
      'The patient, an assigned doctor or an admin (FR2.5). Scans, analyses and reports in one list, newest first. Each entry has its type, date and details. Patients only see reports that were sent to them.',
  })
  history(@User() user: HUserDocument, @Param('patientId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.patientService.history(user, id);
  }

  @Get(':patientId/analyses')
  @Auth()
  @ApiOperation({
    summary: "List a patient's analyses",
    description:
      'The patient, an assigned doctor or an admin (FR4.1, FR4.2). Newest first, paginated. Each item has grade, confidence, image and Grad-CAM URLs and the disclaimer.',
  })
  analyses(@User() user: HUserDocument, @Param('patientId', ParseObjectIdPipe) id: Types.ObjectId, @Query() query: PaginationQueryDto) {
    return this.analysisService.list(user, { ...query, patientId: id.toString() });
  }

  @Get(':patientId/reports')
  @Auth()
  @ApiOperation({
    summary: "List a patient's reports",
    description: 'The patient, an assigned doctor or an admin. Patients only see reports that were sent to them.',
  })
  reports(@User() user: HUserDocument, @Param('patientId', ParseObjectIdPipe) id: Types.ObjectId, @Query() query: PaginationQueryDto) {
    return this.reportService.list(user, { ...query, patientId: id.toString() });
  }
}
