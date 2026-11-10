import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { DoctorReviewService } from './doctor-review.service.js';
import { CreateDoctorReviewDto, DoctorReviewQueryDto, UpdateDoctorReviewDto } from './dto/doctor-review.dto.js';
import { RateLimit } from '../../dependency/decorator/rate-limit.decorator.js';

@ApiTags('Doctor reviews')
@Controller('api/v1/doctor-reviews')
@Auth()
export class DoctorReviewController {
  constructor(private readonly service: DoctorReviewService) {}

  @RateLimit.create()
  @Post()
  @Auth([SystemRoleEnum.DOCTOR])
  @ApiOperation({
    summary: 'Review an AI result',
    description:
      'Assigned doctor only. Records whether the doctor agrees with the AI grade, the confirmed grade (0–4), notes, recommendations and an optional follow-up date. The analysis must be completed. One review per doctor per analysis (409 otherwise). A follow-up date notifies the patient.',
  })
  create(@User() user: HUserDocument, @Body() dto: CreateDoctorReviewDto) {
    return this.service.create(user, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List reviews',
    description: 'Patient: reviews of their analyses. Doctor: their assigned patients. Admin: all. Filter by analysisId or patientId.',
  })
  list(@User() user: HUserDocument, @Query() query: DoctorReviewQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':reviewId')
  @ApiOperation({
    summary: 'Get a review',
    description: 'The patient, an assigned doctor or an admin.',
  })
  findOne(@User() user: HUserDocument, @Param('reviewId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Patch(':reviewId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  @ApiOperation({
    summary: 'Update a review',
    description: 'The doctor who wrote it, or an admin. A new follow-up date notifies the patient.',
  })
  update(@User() user: HUserDocument, @Param('reviewId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateDoctorReviewDto) {
    return this.service.update(user, id, dto);
  }

  @Delete(':reviewId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  @ApiOperation({
    summary: 'Delete a review',
    description: 'The doctor who wrote it, or an admin.',
  })
  remove(@User() user: HUserDocument, @Param('reviewId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }
}
