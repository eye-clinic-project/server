import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { serveFile, uploadToDisk, type StoredUpload } from '@nestjs/storage';
import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import type { Types } from 'mongoose';

import type { IUser } from '../../dependencies/interface/index.js';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CreatePatientDto } from '../patient/dto/index.js';
import { PatientEntity } from '../patient/entity/index.js';
import { SearchPatientsDto, SubmitLicenseDto, UpdateClinicDto } from './dto/index.js';
import { DoctorClinicEntity, type PatientSearchPage, VerificationEntity } from './entity/index.js';
import { DoctorService } from './doctor.service.js';
import { Auth, User } from '../../dependencies/decorator/index.js';
import { SystemRoleEnum } from '../../dependencies/enum/index.js';

const { DOCTOR } = SystemRoleEnum;

const LICENSE_MAX_BYTES = 10 * 1024 * 1024;
const LICENSE_MAX_FILES = 3;
const LICENSE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

@Controller('doctor')
@Auth()
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Get('me/verification')
  @Auth({ roles: [DOCTOR] })
  getVerification(@User() user: IUser): Promise<VerificationEntity> {
    return this.doctorService.getVerification(user);
  }

  @Put('me/verification')
  @Auth({ roles: [DOCTOR] })
  @UseInterceptors(
    FilesInterceptor('documents', LICENSE_MAX_FILES, {
      storage: uploadToDisk({ disk: 'private', contentTypes: LICENSE_TYPES, key: (file) => `licenses/${randomUUID()}${file.extension}` }),
      limits: { fileSize: LICENSE_MAX_BYTES, files: LICENSE_MAX_FILES },
    }),
  )
  submitLicense(@User() user: IUser, @UploadedFiles() files: StoredUpload[] | undefined, @Body() body: SubmitLicenseDto): Promise<VerificationEntity> {
    if (!files?.length) throw new BadRequestException('Upload at least one license document');
    return this.doctorService.submitLicense(user, body, files);
  }

  @Get('me/verification/documents/:index')
  @Auth({ roles: [DOCTOR] })
  async licenseDocument(@User() user: IUser, @Param('index', ParseIntPipe) index: number, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { key, filename } = await this.doctorService.licenseDocumentKey(user, index);
    return serveFile(this.doctorService.storage, key, { req, res, disposition: 'inline', filename, cacheControl: 'private, no-store' });
  }

  @Get('me/clinic')
  @Auth({ roles: [DOCTOR] })
  getClinic(@User() user: IUser): Promise<DoctorClinicEntity> {
    return this.doctorService.getClinic(user);
  }

  @Patch('me/clinic')
  @Auth({ roles: [DOCTOR] })
  updateClinic(@User() user: IUser, @Body() body: UpdateClinicDto): Promise<DoctorClinicEntity> {
    return this.doctorService.updateClinic(user, body);
  }

  @Post('patients')
  @Auth({ roles: [DOCTOR] })
  @HttpCode(HttpStatus.CREATED)
  createPatient(@User() user: IUser, @Body() body: CreatePatientDto): Promise<PatientEntity> {
    return this.doctorService.createPatient(user, body);
  }

  @Get('patients/search')
  @Auth({ roles: [DOCTOR] })
  searchPatients(@User() user: IUser, @Query() query: SearchPatientsDto): Promise<PatientSearchPage> {
    return this.doctorService.searchPatients(user, query);
  }

  @Post('patients/:id/assign')
  @Auth({ roles: [DOCTOR] })
  async assignPatient(
    @User() user: IUser,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Res({ passthrough: true }) res: Response,
  ): Promise<PatientEntity> {
    const { created, patient } = await this.doctorService.assignPatient(user, id);
    res.status(created ? HttpStatus.CREATED : HttpStatus.OK);
    return patient;
  }

  @Delete('patients/:id')
  @Auth({ roles: [DOCTOR] })
  @HttpCode(HttpStatus.NO_CONTENT)
  unassignPatient(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<void> {
    return this.doctorService.unassignPatient(user, id);
  }
}
