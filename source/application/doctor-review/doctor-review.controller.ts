import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { DoctorReviewService } from './doctor-review.service.js';
import { CreateDoctorReviewDto, DoctorReviewQueryDto, UpdateDoctorReviewDto } from './dto/doctor-review.dto.js';

@ApiTags('Doctor reviews')
@Controller('api/v1/doctor-reviews')
@Auth()
export class DoctorReviewController {
  constructor(private readonly service: DoctorReviewService) {}

  @Post()
  @Auth([SystemRoleEnum.DOCTOR])
  create(@User() user: HUserDocument, @Body() dto: CreateDoctorReviewDto) {
    return this.service.create(user, dto);
  }

  @Get()
  list(@User() user: HUserDocument, @Query() query: DoctorReviewQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':reviewId')
  findOne(@User() user: HUserDocument, @Param('reviewId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Patch(':reviewId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  update(@User() user: HUserDocument, @Param('reviewId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateDoctorReviewDto) {
    return this.service.update(user, id, dto);
  }

  @Delete(':reviewId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  remove(@User() user: HUserDocument, @Param('reviewId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }
}
