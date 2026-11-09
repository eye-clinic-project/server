import { Body, Controller, Delete, Get, Param, Patch, Post, Query, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { ReportService } from './report.service.js';
import { CreateReportDto, ReportQueryDto, UpdateReportDto } from './dto/report.dto.js';

@ApiTags('Medical reports')
@Controller('api/v1/reports')
@Auth()
export class ReportController {
  constructor(private readonly service: ReportService) {}

  @Post()
  @Auth([SystemRoleEnum.DOCTOR])
  create(@User() user: HUserDocument, @Body() dto: CreateReportDto) {
    return this.service.create(user, dto);
  }

  @Get()
  list(@User() user: HUserDocument, @Query() query: ReportQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':reportId')
  findOne(@User() user: HUserDocument, @Param('reportId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Get(':reportId/pdf')
  async pdf(@User() user: HUserDocument, @Param('reportId', ParseObjectIdPipe) id: Types.ObjectId) {
    const file = await this.service.renderPdf(user, id);
    return new StreamableFile(file.buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${file.filename}"`,
    });
  }

  @Patch(':reportId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  update(@User() user: HUserDocument, @Param('reportId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateReportDto) {
    return this.service.update(user, id, dto);
  }

  @Delete(':reportId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  remove(@User() user: HUserDocument, @Param('reportId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }

  @Post(':reportId/send')
  @Auth([SystemRoleEnum.DOCTOR])
  send(@User() user: HUserDocument, @Param('reportId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.send(user, id);
  }
}
