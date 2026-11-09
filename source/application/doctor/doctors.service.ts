import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { HUserDocument } from '../../database/model/user.model.js';
import { UserRepository } from '../../database/repository/user.repository.js';
import { DoctorRepository } from '../../database/repository/doctor.repository.js';
import { DoctorPatientRepository } from '../../database/repository/doctor-patient.repository.js';
import { AnalysisRepository } from '../../database/repository/analysis.repository.js';
import { AppointmentRepository } from '../../database/repository/appointment.repository.js';
import { ReportRepository } from '../../database/repository/report.repository.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { AnalysisStatus, AppointmentStatus, AssignmentStatus, ReportStatus } from '../../dependency/enum/database.enum.js';
import { ProfileService, isDuplicateKeyError } from '../../dependency/service/profile.service.js';
import { escapeRegex } from '../../dependency/service/util.service.js';
import { presentAnalysis, presentUser } from '../../dependency/presenter.js';
import { DoctorSearchQueryDto, UpdateDoctorDto } from './dto/doctor.dto.js';
import { ConflictException } from '@nestjs/common';

@Injectable()
export class DoctorsService {
  constructor(
    private readonly users: UserRepository,
    private readonly doctors: DoctorRepository,
    private readonly assignments: DoctorPatientRepository,
    private readonly analyses: AnalysisRepository,
    private readonly appointments: AppointmentRepository,
    private readonly reports: ReportRepository,
    private readonly profiles: ProfileService,
  ) {}

  assertSelfOrAdmin(viewer: HUserDocument, doctorId: Types.ObjectId) {
    if (viewer.role !== SystemRoleEnum.ADMIN && !viewer._id.equals(doctorId)) {
      throw new ForbiddenException('You can only access your own data');
    }
  }

  async getById(doctorId: Types.ObjectId) {
    const user = await this.users.findById({ _id: doctorId, options: { lean: true } });
    if (!user || (user as any).role !== SystemRoleEnum.DOCTOR) {
      throw new NotFoundException('Doctor not found');
    }
    const profile = await this.doctors.findOne({ filter: { user: doctorId }, options: { lean: true } });
    return { ...presentUser(user), profile: profile ?? null };
  }

  /** Creates the profile on first save (e.g. doctors who signed up with Google). */
  async updateMe(user: HUserDocument, dto: UpdateDoctorDto) {
    const existing = await this.doctors.findOne({ filter: { user: user._id } });
    try {
      if (!existing) {
        if (!dto.clinicName || !dto.clinicAddress) {
          throw new BadRequestException('clinicName and clinicAddress are required to complete your profile');
        }
        await this.profiles.createDoctorProfile(user._id, { ...dto, clinicName: dto.clinicName, clinicAddress: dto.clinicAddress });
      } else {
        await this.doctors.updateOne({ filter: { _id: existing._id }, update: { $set: dto } });
      }
    } catch (error) {
      if (isDuplicateKeyError(error)) throw new ConflictException('This license number is already registered');
      throw error;
    }
    return this.getById(user._id);
  }

  async search(query: DoctorSearchQueryDto) {
    const userFilter: Record<string, any> = {
      role: SystemRoleEnum.DOCTOR,
      isActive: { $ne: false },
      emailVerifiedAt: { $ne: null },
    };
    if (query.search) userFilter.name = { $regex: escapeRegex(query.search), $options: 'i' };
    if (query.city) userFilter.city = { $regex: `^${escapeRegex(query.city)}$`, $options: 'i' };
    if (query.specialty) {
      const matching = await this.doctors.find({
        filter: { specialty: { $regex: escapeRegex(query.specialty), $options: 'i' } },
        projection: { user: 1 },
        options: { lean: true },
      });
      userFilter._id = { $in: matching.map((d: any) => d.user) };
    }
    const page = await this.users.paginate({
      filter: userFilter,
      options: { sort: { name: 1 }, lean: true },
      page: query.page,
      size: query.size,
    });
    const profiles = await this.doctors.find({
      filter: { user: { $in: page.docs.map((u: any) => u._id) } },
      options: { lean: true },
    });
    const byUser = new Map(profiles.map((p: any) => [p.user.toString(), p]));
    return {
      items: page.docs.map((u: any) => ({ ...presentUser(u), profile: byUser.get(u._id.toString()) ?? null })),
      total: page.count,
      page: page.currentPage,
      size: page.size,
      pages: page.pages,
    };
  }

  /** Summary numbers for the doctor dashboard. */
  async dashboard(doctor: HUserDocument) {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 3600 * 1000);
    const patientIds = await this.assignments.activePatientIds(doctor._id);

    const [pendingRequests, analysesTotal, referable, failed, todayAppointments, pendingAppointments, draftReports, recent] =
      await Promise.all([
        this.assignments.typedModel.countDocuments({ doctor: doctor._id, status: AssignmentStatus.PENDING }),
        this.analyses.typedModel.countDocuments({ doctor: doctor._id }),
        this.analyses.typedModel.countDocuments({ doctor: doctor._id, status: AnalysisStatus.COMPLETED, predictedLevel: { $gte: 2 } }),
        this.analyses.typedModel.countDocuments({ doctor: doctor._id, status: AnalysisStatus.FAILED }),
        this.appointments.find({
          filter: { doctor: doctor._id, scheduledAt: { $gte: startOfDay, $lt: endOfDay }, status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] } },
          options: { sort: { scheduledAt: 1 }, populate: [{ path: 'patient' }], lean: true },
        }),
        this.appointments.typedModel.countDocuments({ doctor: doctor._id, status: AppointmentStatus.PENDING, scheduledAt: { $gte: now } }),
        this.reports.typedModel.countDocuments({ doctor: doctor._id, status: ReportStatus.DRAFT }),
        this.analyses.find({
          filter: { doctor: doctor._id },
          projection: { history: 0 },
          options: { sort: { createdAt: -1 }, limit: 5, populate: [{ path: 'patient' }], lean: true },
        }),
      ]);

    return {
      patients: patientIds.length,
      pendingPatientRequests: pendingRequests,
      analyses: analysesTotal,
      referableCases: referable,
      failedAnalyses: failed,
      pendingAppointments,
      draftReports,
      todayAppointments: todayAppointments.map((a: any) => ({
        id: a._id.toString(),
        scheduledAt: a.scheduledAt,
        status: a.status,
        reason: a.reason,
        patient: presentUser(a.patient),
      })),
      recentAnalyses: recent.map((a: any) => presentAnalysis(a)),
    };
  }
}
