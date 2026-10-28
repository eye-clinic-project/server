import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { CreateDoctorDto } from './dto/create-doctor.dto.js';
import { UpdateDoctorDto } from './dto/update-doctor.dto.js';
import { DoctorService } from './doctor.service.js';
import { RateLimit } from '../../common/decorator/limit.decorator.js';


@Controller('doctor')
@ApiTags('Doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) { }

  @Get()
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  findAll() {
    return this.doctorService.findAll();
  }

  @Get('me')
  @RateLimit({ limit: 10, ttl: 60 })
  @Auth([UserRoleEnum.DOCTOR])
  findMyProfile(@User() user: HUserDocument) {
    return this.doctorService.findProfile(user._id.toString());
  }

  @Post('me')
  @Auth([UserRoleEnum.DOCTOR])
  createMyProfile(
    @User() user: HUserDocument,
    @Body() createDoctorDto: CreateDoctorDto,
  ) {
    return this.doctorService.createProfile(
      user._id.toString(),
      createDoctorDto,
    );
  }

  @Patch('me')
  @Auth([UserRoleEnum.DOCTOR])
  updateMyProfile(
    @User() user: HUserDocument,
    @Body() updateDoctorDto: UpdateDoctorDto,
  ) {
    return this.doctorService.updateProfile(
      user._id.toString(),
      updateDoctorDto,
    );
  }

  @Get('patients')
  @Auth([UserRoleEnum.DOCTOR])
  findAssignedPatients(@User() user: HUserDocument) {
    return this.doctorService.findAssignedPatients(user._id.toString());
  }

  @Post('patients/:patientId')
  @Auth([UserRoleEnum.DOCTOR])
  assignPatient(
    @User() user: HUserDocument,
    @Param('patientId') patientId: string,
  ) {
    return this.doctorService.assignPatient(user._id.toString(), patientId );
  }

  @Delete('patients/:patientId')
  @Auth([UserRoleEnum.DOCTOR])
  unassignPatient(
    @User() user: HUserDocument,
    @Param('patientId') patientId: string,
  ) {
    return this.doctorService.unassignPatient(user._id.toString(), patientId);
  }

  @Get('patients/:patientId/records')
  @Auth([UserRoleEnum.DOCTOR])
  getPatientRecords(
    @User() user: HUserDocument,
    @Param('patientId') patientId: string,
  ) {
    return this.doctorService.getAssignedPatientRecords(
      user._id.toString(),
      patientId,
    );
  }

  @Get('appointments')
  @Auth([UserRoleEnum.DOCTOR])
  getAppointments(@User() user: HUserDocument) {
    return this.doctorService.getDoctorAppointments(user._id.toString());
  }


  @Get(':doctorId')
  @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
  findOne(@Param('doctorId') doctorId: string) {
    return this.doctorService.findProfile(doctorId);
  }
}
