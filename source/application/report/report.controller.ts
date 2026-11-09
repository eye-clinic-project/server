import { Body, Controller, Delete, Get, Param, Patch, Post, Query, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  @ApiOperation({
    summary: "Generate a report",
    description: "Assigned doctor only (FR4.3). Creates a draft report from a completed analysis with patient details, image, grade, heatmap and doctor notes. Notes and recommendations default to the doctor's review. Patients cannot see drafts.",
  })
  create(@User() user: HUserDocument, @Body() dto: CreateReportDto) {
    return this.service.create(user, dto);
  }

  @Get()
  @ApiOperation({
    summary: "List reports",
    description: "Patient: only reports sent to them. Doctor: their assigned patients. Admin: all. Filter by patientId and status (draft, sent).",
  })
  list(@User() user: HUserDocument, @Query() query: ReportQueryDto) {
    return this.service.list(user, query);
  }

  @Get(':reportId')
  @ApiOperation({
    summary: "Get a report",
    description: "The patient (sent reports only), an assigned doctor or an admin. Returns the full on-screen report. The first time the patient opens it, viewedAt is set.",
  })
  findOne(@User() user: HUserDocument, @Param('reportId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.findOne(user, id);
  }

  @Get(':reportId/pdf')
  @ApiOperation({
    summary: "Download the report as PDF",
    description: "Same access as GET /reports/{id} (FR4.5). The PDF has the same content as the on-screen report, including the fundus image, Grad-CAM and the decision-support disclaimer (NFR19).",
  })
  async pdf(@User() user: HUserDocument, @Param('reportId', ParseObjectIdPipe) id: Types.ObjectId) {
    const file = await this.service.renderPdf(user, id);
    return new StreamableFile(file.buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="${file.filename}"`,
    });
  }

  @Patch(':reportId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  @ApiOperation({
    summary: "Edit a report",
    description: "The doctor who wrote it, or an admin. Edits title, notes and recommendations.",
  })
  update(@User() user: HUserDocument, @Param('reportId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateReportDto) {
    return this.service.update(user, id, dto);
  }

  @Delete(':reportId')
  @Auth([SystemRoleEnum.DOCTOR, SystemRoleEnum.ADMIN])
  @ApiOperation({
    summary: "Delete a report",
    description: "The doctor who wrote it, or an admin.",
  })
  remove(@User() user: HUserDocument, @Param('reportId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.remove(user, id);
  }

  @Post(':reportId/send')
  @Auth([SystemRoleEnum.DOCTOR])
  @ApiOperation({
    summary: "Send the report to the patient",
    description: "The doctor who wrote it (FR4.4). Status becomes sent, so the patient can see it and the doctor sees sent. The patient gets an in-app notification and an email with no medical details, only a link to log in (FR4.6). Sending again re-notifies the patient.",
  })
  send(@User() user: HUserDocument, @Param('reportId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.send(user, id);
  }
}
