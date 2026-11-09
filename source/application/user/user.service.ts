import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import type { HUserDocument } from '../../database/model/user.model.js';
import { UserRepository } from '../../database/repository/user.repository.js';
import { DoctorRepository } from '../../database/repository/doctor.repository.js';
import { PatientRepository } from '../../database/repository/patient.repository.js';
import { DoctorPatientRepository } from '../../database/repository/doctor-patient.repository.js';
import { NotificationRepository } from '../../database/repository/notification.repository.js';
import { FundusImageRepository } from '../../database/repository/fundus-image.repository.js';
import { AnalysisRepository } from '../../database/repository/analysis.repository.js';
import { ReportRepository } from '../../database/repository/report.repository.js';
import { DoctorAvailabilityRepository } from '../../database/repository/doctor-availability.repository.js';
import { DoctorReviewRepository } from '../../database/repository/doctor-review.repository.js';
import { AuthProviderEnum, SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { AssignmentStatus } from '../../dependency/enum/database.enum.js';
import { presentUser } from '../../dependency/presenter.js';
import { SecurityService } from '../../dependency/service/security.service.js';
import { StorageService, extensionForMime } from '../../dependency/service/storage.service.js';
import { TokenService } from '../../dependency/service/token.service.js';
import { AccessService } from '../../dependency/service/access.service.js';
import { DeleteAccountDto, UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UserService {
  constructor(
    private readonly users: UserRepository,
    private readonly doctors: DoctorRepository,
    private readonly patients: PatientRepository,
    private readonly assignments: DoctorPatientRepository,
    private readonly notifications: NotificationRepository,
    private readonly images: FundusImageRepository,
    private readonly analyses: AnalysisRepository,
    private readonly reports: ReportRepository,
    private readonly slots: DoctorAvailabilityRepository,
    private readonly reviews: DoctorReviewRepository,
    private readonly security: SecurityService,
    private readonly storage: StorageService,
    private readonly tokens: TokenService,
    private readonly access: AccessService,
  ) {}

  async profileOf(user: { _id: Types.ObjectId; role: SystemRoleEnum }) {
    if (user.role === SystemRoleEnum.DOCTOR) {
      return this.doctors.findOne({ filter: { user: user._id }, options: { lean: true } });
    }
    if (user.role === SystemRoleEnum.PATIENT) {
      return this.patients.findOne({ filter: { user: user._id }, options: { lean: true } });
    }
    return null;
  }

  /** Current user with role profile; tells the client which dashboard to open (FR1.2). */
  async getMe(user: HUserDocument) {
    const profile = await this.profileOf(user);
    return {
      ...presentUser(user),
      consentAcceptedAt: user.consentAcceptedAt ?? null,
      lang: user.lang ?? 'en',
      profile,
      profileComplete: user.role !== SystemRoleEnum.DOCTOR || !!profile,
      dashboard: `/${user.role}`,
    };
  }

  async updateMe(user: HUserDocument, dto: UpdateUserDto) {
    const updated = await this.users.updateUserProfile(user._id, dto);
    if (!updated) throw new NotFoundException('Account not found');
    return this.getMe(updated);
  }

  async updateAvatar(user: HUserDocument, file: Express.Multer.File) {
    const key = await this.storage.save('avatars', file.buffer, extensionForMime(file.mimetype));
    const previous = user.avatarKey;
    const updated = await this.users.updateUserProfile(user._id, { avatarKey: key });
    await this.storage.remove(previous);
    return this.getMe(updated!);
  }

  async removeAvatar(user: HUserDocument) {
    await this.storage.remove(user.avatarKey);
    const updated = await this.users.findByIdAndUpdate({
      _id: user._id,
      update: { $set: { avatarKey: null } },
    });
    return this.getMe(updated!);
  }

  async avatarFile(userId: Types.ObjectId) {
    const user = await this.users.findById({ _id: userId });
    if (!user?.avatarKey) throw new NotFoundException('Avatar not found');
    return { data: await this.storage.read(user.avatarKey), mimeType: user.avatarKey.includes('.png.') ? 'image/png' : 'image/jpeg' };
  }

  /**
   * Profile of another user. Anyone signed in can see a doctor's public profile;
   * patient profiles are limited to assigned doctors and admins.
   */
  async getUser(viewer: HUserDocument, userId: Types.ObjectId) {
    const user = await this.users.findById({ _id: userId });
    if (!user) throw new NotFoundException('User not found');

    if (!viewer._id.equals(userId) && !this.access.isAdmin(viewer)) {
      if (user.role === SystemRoleEnum.PATIENT) {
        await this.access.assertCanAccessPatient(viewer, userId);
      } else if (user.role !== SystemRoleEnum.DOCTOR) {
        throw new ForbiddenException('You do not have access to this user');
      }
    }
    return { ...presentUser(user), profile: await this.profileOf(user) };
  }

  /** Deletes the account and, for patients, all their medical data and files. */
  async deleteMe(user: HUserDocument, dto: DeleteAccountDto) {
    if (user.provider === AuthProviderEnum.SYSTEM) {
      const account = await this.users.findByEmail(user.email);
      if (account?.passwordHash) {
        if (!dto.password) throw new BadRequestException('Password is required');
        if (!(await this.security.compare(dto.password, account.passwordHash))) {
          throw new UnauthorizedException('Password is incorrect');
        }
      }
    }
    await this.deleteAccount(user._id);
    return { deleted: true };
  }

  async deleteAccount(userId: Types.ObjectId) {
    const user = await this.users.findById({ _id: userId });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === SystemRoleEnum.PATIENT) {
      const images = await this.images.find({
        filter: { patient: userId },
        projection: { storageKey: 1 },
        options: { lean: true },
      });
      const analyses = await this.analyses.find({
        filter: { patient: userId },
        projection: { gradCamKey: 1 },
        options: { lean: true },
      });
      await Promise.all([
        ...images.map((img: any) => this.storage.remove(img.storageKey)),
        ...analyses.map((a: any) => this.storage.remove(a.gradCamKey)),
      ]);
      await Promise.all([
        this.images.deleteMany({ filter: { patient: userId } }),
        this.analyses.deleteMany({ filter: { patient: userId } }),
        this.reports.deleteMany({ filter: { patient: userId } }),
        this.reviews.deleteMany({ filter: { patient: userId } }),
        this.patients.deleteOne({ filter: { user: userId } }),
        this.assignments.deleteMany({ filter: { patient: userId } }),
      ]);
    } else if (user.role === SystemRoleEnum.DOCTOR) {
      await Promise.all([
        this.doctors.deleteOne({ filter: { user: userId } }),
        this.assignments.updateMany({
          filter: { doctor: userId },
          update: { $set: { status: AssignmentStatus.ENDED, endedAt: new Date() } },
        }),
        this.slots.deleteMany({ filter: { doctor: userId, isBooked: false } }),
      ]);
    }
    await this.storage.remove(user.avatarKey);
    await this.notifications.deleteMany({ filter: { recipient: userId } });
    await this.users.deleteOne({ filter: { _id: userId } });
    await this.tokens.logout(userId);
  }
}
