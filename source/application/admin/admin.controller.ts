import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { RateLimit } from '../../dependency/decorator/rate-limit.decorator.js';

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
  @ApiOperation({
    summary: "System statistics",
    description: "Admin only. Users by role, analyses by status, analyses in the last 30 days, grade distribution and totals of reports, appointments, images and devices.",
  })
  dashboard() {
    return this.service.dashboard();
  }

  @RateLimit.search()
  @Get('users')
  @ApiOperation({
    summary: "List users",
    description: "Admin only. Filter by role, isActive and search (name or email). Paginated.",
  })
  users(@Query() query: AdminUserQueryDto) {
    return this.service.listUsers(query);
  }

  @Get('users/:userId')
  @ApiOperation({
    summary: "Get a user",
    description: "Admin only. Account plus role profile.",
  })
  user(@Param('userId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.getUser(id);
  }

  @RateLimit.adminWrite()
  @Patch('users/:userId/status')
  @ApiOperation({
    summary: "Enable or disable a user",
    description: "Admin only. Disabled users are logged out and cannot log in. Admins cannot disable themselves.",
  })
  status(@User() admin: HUserDocument, @Param('userId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateUserStatusDto) {
    return this.service.setStatus(admin, id, dto.isActive);
  }

  @RateLimit.adminWrite()
  @Patch('users/:userId/role')
  @ApiOperation({
    summary: "Change a user's role",
    description: "Admin only. The user is logged out so the new role takes effect. Admins cannot change their own role.",
  })
  role(@User() admin: HUserDocument, @Param('userId', ParseObjectIdPipe) id: Types.ObjectId, @Body() dto: UpdateUserRoleDto) {
    return this.service.setRole(admin, id, dto.role);
  }

  @RateLimit.adminWrite()
  @Delete('users/:userId')
  @ApiOperation({
    summary: "Delete a user",
    description: "Admin only. Same as the user deleting their account, including a patient's medical data.",
  })
  remove(@User() admin: HUserDocument, @Param('userId', ParseObjectIdPipe) id: Types.ObjectId) {
    return this.service.deleteUser(admin, id);
  }

  @Get('analyses')
  @ApiOperation({
    summary: "List all analyses",
    description: "Admin only. Same filters as GET /analyses.",
  })
  allAnalyses(@User() admin: HUserDocument, @Query() query: AnalysisQueryDto) {
    return this.analyses.list(admin, query);
  }

  @Get('reports')
  @ApiOperation({
    summary: "List all reports",
    description: "Admin only. Same filters as GET /reports.",
  })
  allReports(@User() admin: HUserDocument, @Query() query: ReportQueryDto) {
    return this.reports.list(admin, query);
  }
}
