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
import { SecurityService } from '../../dependency/service/security.service.js';
import { TokenService } from '../../dependency/service/token.service.js';
import { ProfileService } from '../../dependency/service/profile.service.js';
import { escapeRegex } from '../../dependency/service/util.service.js';
import { AuthProviderEnum, SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { AnalysisStatus, DoctorVerificationStatus, NotificationType } from '../../dependency/enum/database.enum.js';
import { NotifierService } from '../../dependency/service/notifier.service.js';
import { presentUser } from '../../dependency/presenter.js';
import { UserService } from '../user/user.service.js';
import { AdminDoctorQueryDto, AdminUserQueryDto, ReviewDoctorDto } from './dto/admin.dto.js';

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
    private readonly security: SecurityService,
    private readonly tokens: TokenService,
    private readonly profiles: ProfileService,
    private readonly userService: UserService,
    private readonly config: ConfigService,
    private readonly notifier: NotifierService,
  ) {}

  /** Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD when it does not exist yet. */
  toMap = (rows: { _id: unknown; count: number }[]) => Object.fromEntries(rows.map((r) => [String(r._id), r.count]));

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
    await this.tokens.logout(id);
    return presentUser(user);
  }

  async deleteUser(admin: HUserDocument, id: Types.ObjectId) {
    if (admin._id.equals(id)) throw new BadRequestException('Use DELETE /users/me to delete your own account');
    await this.userService.deleteAccount(id);
    return { deleted: true };
  }

  /** Doctors with their license review status, oldest pending first so nobody waits too long. */
  async listDoctors(query: AdminDoctorQueryDto) {
    const doctorFilter: Record<string, unknown> = {};
    if (query.status === DoctorVerificationStatus.PENDING) {
      // Profiles created before the review feature have no status yet and count as pending.
      doctorFilter.verificationStatus = { $in: [DoctorVerificationStatus.PENDING, null] };
    } else if (query.status) {
      doctorFilter.verificationStatus = query.status;
    }

    let userIds: Types.ObjectId[] | undefined;
    if (query.search) {
      const regex = { $regex: escapeRegex(query.search), $options: 'i' };
      const matchingUsers = await this.users.find({
        filter: { role: SystemRoleEnum.DOCTOR, $or: [{ name: regex }, { email: regex }] },
        projection: { _id: 1 },
        options: { lean: true },
      });
      userIds = matchingUsers.map((u: { _id: Types.ObjectId }) => u._id);
      doctorFilter.$or = [{ user: { $in: userIds } }, { licenseNumber: regex }, { clinicName: regex }];
    }

    const page = await this.doctors.paginate({
      filter: doctorFilter,
      options: { sort: { verificationSubmittedAt: 1, createdAt: 1 }, lean: true },
      page: query.page,
      size: query.size,
    });
    const users = await this.users.find({
      filter: { _id: { $in: page.docs.map((d: any) => d.user) } },
      options: { lean: true },
    });
    const byId = new Map(users.map((u: any) => [u._id.toString(), u]));
    return {
      items: page.docs.map((profile: any) => ({
        ...presentUser(byId.get(profile.user.toString()) ?? profile.user),
        profile: {
          ...profile,
          verificationStatus: profile.verificationStatus ?? DoctorVerificationStatus.PENDING,
        },
      })),
      total: page.count,
      page: page.currentPage,
      size: page.size,
      pages: page.pages,
    };
  }

  /** Approves or rejects a doctor's license and tells the doctor (in-app and by email). */
  async reviewDoctor(admin: HUserDocument, doctorUserId: Types.ObjectId, dto: ReviewDoctorDto) {
    const profile = await this.doctors.findOne({ filter: { user: doctorUserId } });
    if (!profile) throw new NotFoundException('Doctor profile not found');
    if (!profile.licenseNumber) {
      throw new BadRequestException('This doctor has not entered a license number yet');
    }

    const approved = dto.status === DoctorVerificationStatus.APPROVED;
    await this.doctors.updateOne({
      filter: { _id: profile._id },
      update: {
        $set: {
          verificationStatus: dto.status,
          verifiedAt: new Date(),
          verifiedBy: admin._id,
          rejectionReason: approved ? null : (dto.reason ?? null),
        },
      },
    });

    await this.notifier
      .notify({
        recipient: doctorUserId,
        type: NotificationType.SYSTEM,
        title: approved ? 'Your medical license was approved' : 'Your medical license was not approved',
        body: approved
          ? 'Your doctor account is now active. You can start adding patients and analysing scans.'
          : `Reason: ${dto.reason}. Update your license number to request a new review.`,
        link: approved ? '/doctor' : '/doctor/pending',
        email: true,
      })
      .catch((error: Error) => this.logger.error(`Review notification failed: ${error.message}`));

    return this.getUser(doctorUserId);
  }

  async dashboard() {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const [byRole, analysesByStatus, gradeDistribution, reports, appointments, images, last30] = await Promise.all([
      this.users.rawModel.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]).exec(),
      this.analyses.typedModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).exec(),
      this.analyses.typedModel.aggregate([{ $match: { status: AnalysisStatus.COMPLETED } }, { $group: { _id: '$predictedLevel', count: { $sum: 1 } } }]).exec(),
      this.reports.typedModel.countDocuments(),
      this.appointments.typedModel.countDocuments(),
      this.images.typedModel.countDocuments(),
      this.analyses.typedModel.countDocuments({ createdAt: { $gte: since } }),
    ]);
    const pendingDoctors = await this.doctors.typedModel.countDocuments({
      verificationStatus: { $in: [DoctorVerificationStatus.PENDING, null] },
    });

    return {
      users: this.toMap(byRole),
      analyses: this.toMap(analysesByStatus),
      analysesLast30Days: last30,
      gradeDistribution: this.toMap(gradeDistribution),
      reports,
      appointments,
      fundusImages: images,
      pendingDoctors,
    };
  }
}
