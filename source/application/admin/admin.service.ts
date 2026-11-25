import { BadRequestException, Injectable, Logger, NotFoundException, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PasswordHasher, TokenService } from '@nestjs/authentication';
import { InjectDisk, StorageDisk } from '@nestjs/storage';
import { Types } from 'mongoose';

import { DoctorVerificationStatus } from '../../dependencies/enum/database.enum.js';
import type { IUser } from '../../dependencies/interface/database.interface.js';
import { DecideDoctorCommand } from './custom/command/decide-doctor.command.js';
import { EnsureAdminCommand } from './custom/command/ensure-admin.command.js';
import { SetUserActiveCommand } from './custom/command/set-user-active.command.js';
import { FindDoctorQuery } from './custom/query/find-doctor.query.js';
import { ListDoctorsQuery } from './custom/query/list-doctors.query.js';
import { ListDoctorsDto } from './dto/list-doctors.dto.js';
import { RejectDoctorDto } from './dto/reject-doctor.dto.js';
import { UpdateUserStatusDto } from './dto/update-user-status.dto.js';
import { AdminDoctorEntity, toAdminDoctorEntity } from './entity/admin-doctor.entity.js';
import type { AdminDoctorPage, AdminDoctorView } from './type/admin.type.js';
import { ADMIN_DOCTOR_DECIDED_EVENT, AdminDoctorDecidedEvent } from './event/admin-doctor-decided.event.js';

@Injectable()
export class AdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventEmitter: EventEmitter2,
    private readonly tokenService: TokenService,
    private readonly passwordHasher: PasswordHasher,
    private readonly configService: ConfigService,
    @InjectDisk('private') private readonly disk: StorageDisk,
  ) {}

  get storage(): StorageDisk {
    return this.disk;
  }

  async onApplicationBootstrap(): Promise<void> {
    const email = this.configService.get<string>('app.admin.email');
    const password = this.configService.get<string>('app.admin.password');
    if (!email || !password) {
      this.logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD is empty, so no admin account was created');
      return;
    }
    try {
      const created = await this.commandBus.execute(new EnsureAdminCommand(email, await this.passwordHasher.hash(password)));
      if (created) this.logger.log('Created the admin account from ADMIN_EMAIL');
    } catch (error) {
      this.logger.warn(`Could not create the admin account: ${(error as Error).message}`);
    }
  }

  async listDoctors({ status, submitted, search, page = 1, size = 10 }: ListDoctorsDto): Promise<AdminDoctorPage> {
    const result = await this.queryBus.execute(new ListDoctorsQuery({ status, submitted, search, page, size }));
    return { ...result, docs: result.docs.map((doctor) => toAdminDoctorEntity(doctor)) };
  }

  async getDoctor(doctorId: Types.ObjectId): Promise<AdminDoctorEntity> {
    return toAdminDoctorEntity(await this.findDoctor(doctorId));
  }

  async licenseDocument(doctorId: Types.ObjectId, index: number): Promise<{ key: string; filename: string }> {
    const doctor = await this.findDoctor(doctorId);
    const document = doctor.licenseDocuments?.[index];
    if (!document) throw new NotFoundException('Document not found');
    return { key: document.key, filename: document.originalName };
  }

  async approve(admin: IUser, doctorId: Types.ObjectId): Promise<AdminDoctorEntity> {
    const doctor = await this.commandBus.execute(new DecideDoctorCommand(doctorId, idOf(admin), DoctorVerificationStatus.APPROVED, null));
    this.afterDecision(admin, doctor, DoctorVerificationStatus.APPROVED, null);
    return toAdminDoctorEntity(doctor);
  }

  async reject(admin: IUser, doctorId: Types.ObjectId, { reason }: RejectDoctorDto): Promise<AdminDoctorEntity> {
    const doctor = await this.commandBus.execute(new DecideDoctorCommand(doctorId, idOf(admin), DoctorVerificationStatus.REJECTED, reason));
    this.afterDecision(admin, doctor, DoctorVerificationStatus.REJECTED, reason);
    return toAdminDoctorEntity(doctor);
  }

  async setUserStatus(admin: IUser, userId: Types.ObjectId, { isActive }: UpdateUserStatusDto): Promise<{ _id: Types.ObjectId; isActive: boolean }> {
    if (userId.equals(idOf(admin))) throw new BadRequestException('You cannot disable your own account');
    const user = await this.commandBus.execute(new SetUserActiveCommand(userId, isActive));
    if (!user) throw new NotFoundException('User not found');
    if (!isActive) await this.tokenService.revokeAll(String(user._id));
    return { _id: user._id, isActive: user.isActive !== false };
  }

  private async findDoctor(doctorId: Types.ObjectId): Promise<AdminDoctorView> {
    const doctor = await this.queryBus.execute(new FindDoctorQuery(doctorId));
    if (!doctor) throw new NotFoundException('Doctor not found');
    return doctor;
  }

  private afterDecision(
    admin: IUser,
    doctor: AdminDoctorView,
    status: DoctorVerificationStatus.APPROVED | DoctorVerificationStatus.REJECTED,
    reason: string | null,
  ): void {
    this.eventEmitter.emit(
      ADMIN_DOCTOR_DECIDED_EVENT,
      new AdminDoctorDecidedEvent(doctor._id.toString(), doctor.user._id.toString(), idOf(admin).toString(), status, reason),
    );
  }
}

const idOf = (user: IUser): Types.ObjectId => new Types.ObjectId(user._id);
