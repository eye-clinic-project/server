import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { PaginationQueryDto } from '../../dependency/dto/pagination.dto.js';
import { PatientService } from './patient.service.js';
import {
  CreatePatientDto,
  DoctorUpdatePatientDto,
  PatientSearchQueryDto,
  UpdatePatientProfileDto,
} from './dto/patient.dto.js';
import { AnalysisService } from '../analysis/analysis.service.js';
import { ReportService } from '../report/report.service.js';

@ApiTags('Patients')
@Controller('api/v1/patients')
export class PatientController {
  constructor(
    private readonly patientService: PatientService,
    private readonly analysisService: AnalysisService,
    private readonly reportService: ReportService,
  ) {}

  @Post()
  @Auth([SystemRoleEnum.DOCTOR])
  create(@User() user: HUserDocument, @Body() dto: CreatePatientDto) {
    return this.patientService.create(user, dto);
  }

  @Get()
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  search(@User() user: HUserDocument, @Query() query: PatientSearchQueryDto) {
    return this.patientService.search(user, query);
  }

  @Get('me')
  @Auth([SystemRoleEnum.PATIENT])
  me(@User() user: HUserDocument) {
    return this.patientService.getMe(user);
  }

  @Patch('me')
  @Auth([SystemRoleEnum.PATIENT])
  updateMe(@User() user: HUserDocument, @Body() dto: UpdatePatientProfileDto) {
    return this.patientService.updateMe(user, dto);
  }

  @Get(':patientId')
  @Auth()
  findOne(@User() user: HUserDocument, @Param('patientId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.patientService.getRecord(user, id);
  }

  @Patch(':patientId')
  @Auth([SystemRoleEnum.DOCTOR])
  update(
    @User() user: HUserDocument,
    @Param('patientId', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() dto: DoctorUpdatePatientDto,
  ) {
    return this.patientService.updateByDoctor(user, id, dto);
  }

  @Get(':patientId/doctors')
  @Auth()
  doctors(@User() user: HUserDocument, @Param('patientId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.patientService.doctorsOf(user, id);
  }

  @Get(':patientId/history')
  @Auth()
  history(@User() user: HUserDocument, @Param('patientId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.patientService.history(user, id);
  }

  @Get(':patientId/analyses')
  @Auth()
  analyses(
    @User() user: HUserDocument,
    @Param('patientId', ParseObjectIdPipe) id: Types.ObjectId,
    @Query() query: PaginationQueryDto,
  ) {
    return this.analysisService.list(user, { ...query, patientId: id.toString() });
  }

  @Get(':patientId/reports')
  @Auth()
  reports(
    @User() user: HUserDocument,
    @Param('patientId', ParseObjectIdPipe) id: Types.ObjectId,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reportService.list(user, { ...query, patientId: id.toString() });
  }
}
