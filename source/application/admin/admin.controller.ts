import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, Req, Res } from '@nestjs/common';
import { serveFile } from '@nestjs/storage';
import type { Request, Response } from 'express';
import type { Types } from 'mongoose';

import type { IUser } from '../../dependencies/interface/database.interface.js';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { AdminService } from './admin.service.js';
import { ListDoctorsDto } from './dto/list-doctors.dto.js';
import { RejectDoctorDto } from './dto/reject-doctor.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import type { AdminDoctorEntity } from './entity/admin-doctor.entity.js';
import type { AdminDoctorPage } from './entity/admin.type.js';
import { Auth } from '../../dependencies/decorator/auth.decorator.js';
import { User } from '../../dependencies/decorator/user.decorator.js';
import { SystemRoleEnum } from '../../dependencies/enum/security.enum.js';

const { ADMIN } = SystemRoleEnum;

@Controller('admin')
@Auth({ roles: [ADMIN] })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('doctors')
  listDoctors(@Query() query: ListDoctorsDto): Promise<AdminDoctorPage> {
    return this.adminService.listDoctors(query);
  }

  @Get('doctors/:id')
  getDoctor(@Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<AdminDoctorEntity> {
    return this.adminService.getDoctor(id);
  }

  @Get('doctors/:id/documents/:index')
  async licenseDocument(
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Param('index', ParseIntPipe) index: number,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { key, filename } = await this.adminService.licenseDocument(id, index);
    return serveFile(this.adminService.storage, key, { req, res, disposition: 'inline', filename, cacheControl: 'private, no-store' });
  }

  @Post('doctors/:id/approve')
  @HttpCode(HttpStatus.OK)
  approve(@User() admin: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId): Promise<AdminDoctorEntity> {
    return this.adminService.approve(admin, id);
  }

  @Post('doctors/:id/reject')
  @HttpCode(HttpStatus.OK)
  reject(@User() admin: IUser, @Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() body: RejectDoctorDto): Promise<AdminDoctorEntity> {
    return this.adminService.reject(admin, id, body);
  }

  @Patch('users/:id/status')
  setUserStatus(
    @User() admin: IUser,
    @Param('id', ParseObjectIdPipe) id: Types.ObjectId,
    @Body() body: UpdateUserStatusDto,
  ): Promise<{ _id: Types.ObjectId; isActive: boolean }> {
    return this.adminService.setUserStatus(admin, id, body);
  }
}
