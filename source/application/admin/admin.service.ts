import { BadRequestException, Injectable, Logger, NotFoundException, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import type { HUserDocument } from '../../database/model/user.model.js';
import { UserRepository } from '../../database/repository/user.repository.js';
import { PatientRepository } from '../../database/repository/patient.repository.js';
import { DoctorRepository } from '../../database/repository/doctor.repository.js';
import { AnalysisRepository } from '../../database/repository/analysis.repository.js';
import { ReportRepository } from '../../database/repository/report.repository.js';
import { AppointmentRepository } from '../../database/repository/appointment.repository.js';
import { FundusImageRepository } from '../../database/repository/fundus-image.repository.js';
import { DeviceRepository } from '../../database/repository/device.repository.js';
import { SecurityService } from '../../dependency/service/security.service.js';
import { TokenService } from '../../dependency/service/token.service.js';
import { ProfileService } from '../../dependency/service/profile.service.js';
import { escapeRegex } from '../../dependency/service/util.service.js';
import { AuthProviderEnum, SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { AnalysisStatus } from '../../dependency/enum/database.enum.js';
import { presentUser } from '../../dependency/presenter.js';
import { UserService } from '../user/user.service.js';
import { AdminUserQueryDto } from './dto/admin.dto.js';

@Injectable()
export class AdminService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly patients: PatientRepository,
    private readonly doctors: DoctorRepository,
    private readonly analyses: AnalysisRepository,
    private readonly reports: ReportRepository,
    private readonly appointments: AppointmentRepository,
    private readonly images: FundusImageRepository,
    private readonly devices: DeviceRepository,
    private readonly security: SecurityService,
    private readonly tokens: TokenService,
    private readonly profiles: ProfileService,
    private readonly userService: UserService,
    private readonly config: ConfigService,
  ) {}

  /** Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD when it does not exist yet. */
  async onApplicationBootstrap() {
    const email = this.config.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    const password = this.config.get<string>('ADMIN_PASSWORD');
    if (!email || !password) return;
    try {
      if (await this.users.emailExists(email)) return;
      await this.users.createAuthUser({
        name: 'Administrator',
        email,
        city: '-',
        role: SystemRoleEnum.ADMIN,
        provider: AuthProviderEnum.SYSTEM,
        passwordHash: await this.security.hash(password),
        emailVerifiedAt: new Date(),
      });
      this.logger.log(`Admin account created for ${email}`);
    } catch (error) {
      this.logger.error(`Could not create admin: ${(error as Error).message}`);
    }
  }

  async listUsers(query: AdminUserQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.role) filter.role = query.role;
    if (query.isActive !== undefined) filter.isActive = query.isActive ? { $ne: false } : false;
    if (query.search) {
      const regex = { $regex: escapeRegex(query.search), $options: 'i' };
      filter.$or = [{ name: regex }, { email: regex }];
    }
    const page = await this.users.paginate({ filter, options: { sort: { createdAt: -1 }, lean: true }, page: query.page, size: query.size });
    return { items: page.docs.map(presentUser), total: page.count, page: page.currentPage, size: page.size, pages: page.pages };
  }

  async getUser(id: Types.ObjectId) {
    const user = await this.users.findById({ _id: id });
    if (!user) throw new NotFoundException('User not found');
    return { ...presentUser(user), profile: await this.userService.profileOf(user) };
  }

  async setStatus(admin: HUserDocument, id: Types.ObjectId, isActive: boolean) {
    if (admin._id.equals(id)) throw new BadRequestException('You cannot disable your own account');
    const user = await this.users.findByIdAndUpdate({ _id: id, update: { $set: { isActive } } });
    if (!user) throw new NotFoundException('User not found');
    if (!isActive) await this.tokens.logout(id);
    return presentUser(user);
  }

  async setRole(admin: HUserDocument, id: Types.ObjectId, role: SystemRoleEnum) {
    if (admin._id.equals(id)) throw new BadRequestException('You cannot change your own role');
    const user = await this.users.findByIdAndUpdate({ _id: id, update: { $set: { role } } });
    if (!user) throw new NotFoundException('User not found');
    if (role === SystemRoleEnum.PATIENT && !(await this.patients.typedModel.exists({ user: id }))) {
      await this.profiles.createPatientProfile(id);
    }
    // Existing tokens carry the old role; force a fresh login.
    await this.tokens.logout(id);
    return presentUser(user);
  }

  async deleteUser(admin: HUserDocument, id: Types.ObjectId) {
    if (admin._id.equals(id)) throw new BadRequestException('Use DELETE /users/me to delete your own account');
    await this.userService.deleteAccount(id);
    return { deleted: true };
  }

  async dashboard() {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const [byRole, analysesByStatus, gradeDistribution, reports, appointments, images, devices, last30] = await Promise.all([
      this.users.rawModel.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]).exec(),
      this.analyses.typedModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).exec(),
      this.analyses.typedModel
        .aggregate([{ $match: { status: AnalysisStatus.COMPLETED } }, { $group: { _id: '$predictedLevel', count: { $sum: 1 } } }])
        .exec(),
      this.reports.typedModel.countDocuments(),
      this.appointments.typedModel.countDocuments(),
      this.images.typedModel.countDocuments(),
      this.devices.typedModel.countDocuments(),
      this.analyses.typedModel.countDocuments({ createdAt: { $gte: since } }),
    ]);
    const toMap = (rows: { _id: unknown; count: number }[]) =>
      Object.fromEntries(rows.map((r) => [String(r._id), r.count]));
    return {
      users: toMap(byRole),
      analyses: toMap(analysesByStatus),
      analysesLast30Days: last30,
      gradeDistribution: toMap(gradeDistribution),
      reports,
      appointments,
      fundusImages: images,
      devices,
    };
  }
}
