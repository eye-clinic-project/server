import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import { UpdatePatientDto } from './dto/update-patient.dto.js';
import { PatientService } from './patient.service.js';

@Controller('patient')
@ApiTags('Patients')
@Auth([UserRoleEnum.PATIENT])
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get('me')
  findMyProfile(@User() user: HUserDocument) {
    return this.patientService.findProfile(user._id);
  }

  @Post('me')
  createMyProfile(
    @User() user: HUserDocument,
    @Body() createPatientDto: CreatePatientDto,
  ) {
    return this.patientService.createProfile(user._id, createPatientDto);
  }

  @Patch('me')
  updateMyProfile(
    @User() user: HUserDocument,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientService.updateProfile(user._id, updatePatientDto);
  }

  @Get('me/medical-records')
  getMyMedicalRecords(@User() user: HUserDocument) {
    return this.patientService.getMedicalRecords(user._id);
  }
}
