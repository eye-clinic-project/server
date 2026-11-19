import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import type { Types } from 'mongoose';

import type { IUser } from '../../dependencies/interface/index.js';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CreatePatientDto, ListPatientsDto, UpdatePatientDto } from './dto/index.js';
import { AssignedDoctorEntity, PatientEntity, type PatientListEntity } from './entity/index.js';
import { PatientService } from './patient.service.js';
import { Auth, User } from '../../dependencies/decorator/index.js';
import { SystemRoleEnum } from '../../dependencies/enum/index.js';

const { ADMIN, DOCTOR, PATIENT } = SystemRoleEnum;

@Controller('patient')
@Auth()
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ roles: [ADMIN, DOCTOR] })
  create(@User() user: IUser, @Body() body: CreatePatientDto): Promise<PatientEntity> {
    return this.patientService.create(user, body);
  }

  @Get()
  @Auth({ roles: [ADMIN, DOCTOR] })
  findAll(@User() user: IUser, @Query() query: ListPatientsDto): Promise<PatientListEntity> {
    return this.patientService.findAll(user, query);
  }

  @Get('me')
  @Auth({ roles: [PATIENT] })
  findMine(@User() user: IUser): Promise<PatientEntity> {
    return this.patientService.findMine(user);
  }

  @Get('me/doctors')
  @Auth({ roles: [PATIENT] })
  findMyDoctors(@User() user: IUser): Promise<AssignedDoctorEntity[]> {
    return this.patientService.findMyDoctors(user);
  }

  @Get(':id')
  @Auth({ roles: [ADMIN, DOCTOR] })
  findOne(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<PatientEntity> {
    return this.patientService.findOne(user, id);
  }

  @Patch(':id')
  @Auth({ roles: [ADMIN, DOCTOR] })
  update(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() body: UpdatePatientDto): Promise<PatientEntity> {
    return this.patientService.update(user, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ roles: [ADMIN, DOCTOR] })
  remove(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<void> {
    return this.patientService.remove(user, id);
  }
}
