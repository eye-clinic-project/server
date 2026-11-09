import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Auth } from '../../dependency/decorator/auth.decorator.js';
import { User } from '../../dependency/decorator/user.decorator.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { ParseObjectIdPipe } from '../../dependency/pipe/object-id.pipe.js';
import { AdminService } from './admin.service.js';
import { AdminUserQueryDto, UpdateUserRoleDto, UpdateUserStatusDto } from './dto/admin.dto.js';
import { AnalysisService } from '../analysis/analysis.service.js';
import { AnalysisQueryDto } from '../analysis/dto/analysis.dto.js';
import { ReportService } from '../report/report.service.js';
import { ReportQueryDto } from '../report/dto/report.dto.js';

@ApiTags('Admin')
@Controller('api/v1/admin')
@Auth([SystemRoleEnum.ADMIN])
export class AdminController {
  constructor(
    private readonly service: AdminService,
    private readonly analyses: AnalysisService,
    private readonly reports: ReportService,
  ) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('users')
  users(@Query() query: AdminUserQueryDto) {
    return this.service.listUsers(query);
  }

  @Get('users/:userId')
  user(@Param('userId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.getUser(id);
  }

  @Patch('users/:userId/status')
  status(@User() admin: HUserDocument, @Param('userId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateUserStatusDto) {
    return this.service.setStatus(admin, id, dto.isActive);
  }

  @Patch('users/:userId/role')
  role(@User() admin: HUserDocument, @Param('userId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateUserRoleDto) {
    return this.service.setRole(admin, id, dto.role);
  }

  @Delete('users/:userId')
  remove(@User() admin: HUserDocument, @Param('userId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.deleteUser(admin, id);
  }

  @Get('analyses')
  allAnalyses(@User() admin: HUserDocument, @Query() query: AnalysisQueryDto) {
    return this.analyses.list(admin, query);
  }

  @Get('reports')
  allReports(@User() admin: HUserDocument, @Query() query: ReportQueryDto) {
    return this.reports.list(admin, query);
  }
}
