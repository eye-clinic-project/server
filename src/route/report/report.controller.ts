import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { UpdateReportDto } from './dto/update-report.dto.js';
import { ReportService } from './report.service.js';

@Controller('report')
@Auth([UserRoleEnum.DOCTOR])
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  create(
    @User() user: HUserDocument,
    @Body() createReportDto: CreateReportDto,
  ) {
    return this.reportService.create(
      user._id.toString(),
      createReportDto,
    );
  }

  @Get()
  findAll(@User() user: HUserDocument) {
    return this.reportService.findAll(user._id.toString());
  }

  @Get(':reportId')
  findOne(
    @User() user: HUserDocument,
    @Param('reportId') reportId: string,
  ) {
    return this.reportService.findOne(user._id.toString(), reportId);
  }

  @Patch(':reportId')
  update(
    @User() user: HUserDocument,
    @Param('reportId') reportId: string,
    @Body() updateReportDto: UpdateReportDto,
  ) {
    return this.reportService.update(
      user._id.toString(),
      reportId,
      updateReportDto,
    );
  }

  @Delete(':reportId')
  remove(
    @User() user: HUserDocument,
    @Param('reportId') reportId: string,
  ) {
    return this.reportService.remove(user._id.toString(), reportId);
  }
}
