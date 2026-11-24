import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { serveFile } from '@nestjs/storage';
import type { Request, Response } from 'express';
import type { Types } from 'mongoose';

import type { IUser } from '../../dependencies/interface/database.interface.js';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CreateReportDto } from './dto/create-report.dto.js';
import { ListReportsDto } from './dto/list-reports.dto.js';
import { UpdateReportDto } from './dto/update-report.dto.js';
import type { Page } from './entity/analysis.type.js';
import type { ReportEntity } from './entity/report.entity.js';
import { ReportService } from './report.service.js';
import { Auth } from '../../dependencies/decorator/auth.decorator.js';
import { User } from '../../dependencies/decorator/user.decorator.js';
import { SystemRoleEnum } from '../../dependencies/enum/security.enum.js';

const { DOCTOR, PATIENT } = SystemRoleEnum;

@Controller('report')
@Auth()
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Auth({ roles: [DOCTOR] })
  create(@User() user: IUser, @Body() body: CreateReportDto): Promise<ReportEntity> {
    return this.reportService.create(user, body);
  }

  @Get()
  @Auth({ roles: [DOCTOR, PATIENT] })
  list(@User() user: IUser, @Query() query: ListReportsDto): Promise<Page<ReportEntity>> {
    return this.reportService.list(user, query);
  }

  @Get(':id')
  @Auth({ roles: [DOCTOR, PATIENT] })
  get(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<ReportEntity> {
    return this.reportService.get(user, id);
  }

  @Patch(':id')
  @Auth({ roles: [DOCTOR] })
  update(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() body: UpdateReportDto): Promise<ReportEntity> {
    return this.reportService.update(user, id, body);
  }

  @Post(':id/regenerate')
  @HttpCode(HttpStatus.OK)
  @Auth({ roles: [DOCTOR] })
  regenerate(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<ReportEntity> {
    return this.reportService.regenerate(user, id);
  }

  @Post(':id/send')
  @HttpCode(HttpStatus.OK)
  @Auth({ roles: [DOCTOR] })
  send(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<ReportEntity> {
    return this.reportService.send(user, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Auth({ roles: [DOCTOR] })
  remove(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<void> {
    return this.reportService.remove(user, id);
  }

  @Get(':id/download')
  @Auth({ roles: [DOCTOR, PATIENT] })
  async download(@User() user: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { key, filename } = await this.reportService.download(user, id);
    return serveFile(this.reportService.storage, key, { req, res, disposition: 'attachment', filename, cacheControl: 'private, no-store' });
  }
}
