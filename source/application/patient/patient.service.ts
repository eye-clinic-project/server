import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import type { HUserDocument } from '../../database/model/user.model.js';
import { UserRepository } from '../../database/repository/user.repository.js';
import { PatientRepository } from '../../database/repository/patient.repository.js';
import { DoctorPatientRepository } from '../../database/repository/doctor-patient.repository.js';
import { DoctorRepository } from '../../database/repository/doctor.repository.js';
import { AnalysisRepository } from '../../database/repository/analysis.repository.js';
import { ReportRepository } from '../../database/repository/report.repository.js';
import { FundusImageRepository } from '../../database/repository/fundus-image.repository.js';
import { AppointmentRepository } from '../../database/repository/appointment.repository.js';
import { AccessService } from '../../dependency/service/access.service.js';
import { ProfileService, isDuplicateKeyError } from '../../dependency/service/profile.service.js';
import { escapeRegex } from '../../dependency/service/util.service.js';
import { AuthProviderEnum, SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import {
  AnalysisStatus,
  AppointmentStatus,
  AssignmentStatus,
  ReportStatus,
} from '../../dependency/enum/database.enum.js';
import { presentAnalysis, presentImage, presentUser } from '../../dependency/presenter.js';
import { AuthenticationService } from '../authentication/authentication.service.js';
import {
  CreatePatientDto,
  DoctorUpdatePatientDto,
  PatientSearchQueryDto,
  UpdatePatientProfileDto,
} from './dto/patient.dto.js';

@Injectable()
export class PatientService {
  private readonly logger = new Logger(PatientService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly patients: PatientRepository,
    private readonly doctors: DoctorRepository,
    private readonly assignments: DoctorPatientRepository,
    private readonly analyses: AnalysisRepository,
    private readonly reports: ReportRepository,
    private readonly images: FundusImageRepository,
    private readonly appointments: AppointmentRepository,
    private readonly access: AccessService,
    private readonly profiles: ProfileService,
    private readonly auth: AuthenticationService,
  ) {}

  private async present(userDoc: any, profile?: any) {
    const p =
      profile ??
      (await this.patients.findOne({ filter: { user: userDoc._id }, options: { lean: true } }));
    return { ...presentUser(userDoc), profile: p ?? null };
  }

  /** FR2.1: doctor creates a patient account + record and is assigned to it. */
  async create(doctor: HUserDocument, dto: CreatePatientDto) {
    const { name, email, city, phone, sendInvitation, ...profile } = dto;
    if (await this.users.findByEmailWithoutPassword(email)) {
      throw new ConflictException(
        'A user with this email already exists. Use "assign patient" to add an existing patient.',
      );
    }
    let user: HUserDocument;
    try {
      user = await this.users.createAuthUser({
        name,
        email,
        city,
        phone,
        role: SystemRoleEnum.PATIENT,
        provider: AuthProviderEnum.SYSTEM,
        emailVerifiedAt: null,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) throw new ConflictException('A user with this email already exists');
      throw error;
    }
    const patientProfile = await this.profiles
      .createPatientProfile(user._id, { ...profile, createdBy: doctor._id })
      .catch(async (error) => {
        await this.users.deleteOne({ filter: { _id: user._id } });
        throw error;
      });
    await this.assignments.create({
      data: {
        doctor: doctor._id,
        patient: user._id,
        status: AssignmentStatus.ACTIVE,
        assignedBy: doctor._id,
        assignedAt: new Date(),
      },
    });
    if (sendInvitation !== false) {
      await this.auth
        .sendInvitation(user._id, email, doctor.name)
        .catch((error: Error) => this.logger.error(`Invitation email failed: ${error.message}`));
    }
    return this.present(user, patientProfile.toObject());
  }

  /**
   * FR2.2: search patients by name, email, patient ID (P-XXXXXX) or user id.
   * Doctors only search their own (actively assigned) patients; admins search everyone.
   */
  async search(viewer: HUserDocument, query: PatientSearchQueryDto, doctorId?: Types.ObjectId) {
    const filter: Record<string, any> = { role: SystemRoleEnum.PATIENT };
    const scopeDoctor = doctorId ?? (viewer.role === SystemRoleEnum.DOCTOR ? viewer._id : undefined);
    if (scopeDoctor) {
      filter._id = { $in: await this.assignments.activePatientIds(scopeDoctor) };
    }

    const term = query.search?.trim();
    if (term) {
      const regex = { $regex: escapeRegex(term), $options: 'i' };
      const or: Record<string, unknown>[] = [{ name: regex }, { email: regex }];
      if (Types.ObjectId.isValid(term) && /^[a-f\d]{24}$/i.test(term)) {
        or.push({ _id: new Types.ObjectId(term) });
      }
      const byRecord = await this.patients.find({
        filter: { medicalRecordNumber: { $regex: escapeRegex(term.toUpperCase()) } },
        projection: { user: 1 },
        options: { lean: true, limit: 50 },
      });
      if (byRecord.length) or.push({ _id: { $in: byRecord.map((p: any) => p.user) } });
      filter.$or = or;
    }

    const page = await this.users.paginate({
      filter,
      options: { sort: { name: 1 }, lean: true },
      page: query.page,
      size: query.size,
    });
    const profiles = await this.patients.find({
      filter: { user: { $in: page.docs.map((u: any) => u._id) } },
      options: { lean: true },
    });
    const byUser = new Map(profiles.map((p: any) => [p.user.toString(), p]));
    const latest = await this.latestAnalyses(page.docs.map((u: any) => u._id));
    return {
      items: page.docs.map((u: any) => ({
        ...presentUser(u),
        profile: byUser.get(u._id.toString()) ?? null,
        latestAnalysis: latest.get(u._id.toString()) ?? null,
      })),
      total: page.count,
      page: page.currentPage,
      size: page.size,
      pages: page.pages,
      message: page.count === 0 ? 'No patients found' : undefined,
    };
  }

  private async latestAnalyses(patientIds: Types.ObjectId[]) {
    if (!patientIds.length) return new Map<string, any>();
    const rows = await this.analyses.typedModel
      .aggregate([
        { $match: { patient: { $in: patientIds }, status: AnalysisStatus.COMPLETED } },
        { $sort: { createdAt: -1 } },
        { $group: { _id: '$patient', doc: { $first: '$$ROOT' } } },
      ])
      .exec();
    return new Map(
      rows.map((row: any) => [
        row._id.toString(),
        {
          id: row.doc._id.toString(),
          predictedLevel: row.doc.predictedLevel,
          hasDR: row.doc.hasDR,
          createdAt: row.doc.createdAt,
        },
      ]),
    );
  }

  async getMe(user: HUserDocument) {
    return this.present(user);
  }

  async updateMe(user: HUserDocument, dto: UpdatePatientProfileDto) {
    const profile = await this.patients.findOneAndUpdate({
      filter: { user: user._id },
      update: { $set: dto },
    });
    if (!profile) throw new NotFoundException('Patient profile not found');
    return this.present(user, profile.toObject());
  }

  /** FR2.4: full record of a patient the viewer may access. */
  async getRecord(viewer: HUserDocument, patientId: Types.ObjectId) {
    await this.access.assertCanAccessPatient(viewer, patientId);
    const user = await this.users.findById({ _id: patientId, options: { lean: true } });
    if (!user || (user as any).role !== SystemRoleEnum.PATIENT) {
      throw new NotFoundException('Patient not found');
    }
    const [base, stats] = await Promise.all([this.present(user), this.stats(patientId)]);
    return { ...base, stats };
  }

  async updateByDoctor(doctor: HUserDocument, patientId: Types.ObjectId, dto: DoctorUpdatePatientDto) {
    await this.access.assertTreatingDoctor(doctor, patientId);
    const profile = await this.patients.findOneAndUpdate({
      filter: { user: patientId },
      update: { $set: dto },
    });
    if (!profile) throw new NotFoundException('Patient not found');
    return this.getRecord(doctor, patientId);
  }

  private async stats(patientId: Types.ObjectId) {
    const [images, analyses, reports, upcoming] = await Promise.all([
      this.images.typedModel.countDocuments({ patient: patientId }),
      this.analyses.typedModel.countDocuments({ patient: patientId }),
      this.reports.typedModel.countDocuments({ patient: patientId }),
      this.appointments.typedModel.countDocuments({
        patient: patientId,
        scheduledAt: { $gte: new Date() },
        status: { $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      }),
    ]);
    return { images, analyses, reports, upcomingAppointments: upcoming };
  }

  async doctorsOf(viewer: HUserDocument, patientId: Types.ObjectId) {
    await this.access.assertCanAccessPatient(viewer, patientId);
    const rows = await this.assignments.find({
      filter: { patient: patientId, status: { $ne: AssignmentStatus.ENDED } },
      options: { populate: [{ path: 'doctor' }], sort: { assignedAt: -1 }, lean: true },
    });
    const profiles = await this.doctors.find({
      filter: { user: { $in: rows.map((r: any) => r.doctor?._id).filter(Boolean) } },
      options: { lean: true },
    });
    const byUser = new Map(profiles.map((p: any) => [p.user.toString(), p]));
    return rows
      .filter((r: any) => r.doctor)
      .map((r: any) => ({
        assignmentId: r._id.toString(),
        status: r.status,
        assignedAt: r.assignedAt,
        doctor: { ...presentUser(r.doctor), profile: byUser.get(r.doctor._id.toString()) ?? null },
      }));
  }

  /**
   * FR2.5: combined, date-ordered timeline of scans, results and reports.
   * Patients only see reports that were sent to them.
   */
  async history(viewer: HUserDocument, patientId: Types.ObjectId) {
    await this.access.assertCanAccessPatient(viewer, patientId);
    const reportFilter: Record<string, unknown> = { patient: patientId };
    if (viewer.role === SystemRoleEnum.PATIENT) reportFilter.status = ReportStatus.SENT;

    const [images, analyses, reports] = await Promise.all([
      this.images.find({ filter: { patient: patientId }, options: { lean: true } }),
      this.analyses.find({
        filter: { patient: patientId },
        projection: { history: 0 },
        options: { lean: true },
      }),
      this.reports.find({ filter: reportFilter, options: { lean: true } }),
    ]);
    const analysisIds = await this.analyses.find({
      filter: { patient: patientId, gradCamKey: { $ne: null } },
      projection: { _id: 1 },
      options: { lean: true },
    });
    const withGradCam = new Set(analysisIds.map((a: any) => a._id.toString()));

    const items = [
      ...images.map((img: any) => ({
        type: 'scan' as const,
        id: img._id.toString(),
        date: img.createdAt,
        title: `Fundus image (${img.eye} eye)`,
        data: presentImage(img),
      })),
      ...analyses.map((a: any) => ({
        type: 'analysis' as const,
        id: a._id.toString(),
        date: a.createdAt,
        title: 'AI analysis',
        data: presentAnalysis({ ...a, hasGradCam: withGradCam.has(a._id.toString()) }),
      })),
      ...reports.map((r: any) => ({
        type: 'report' as const,
        id: r._id.toString(),
        date: r.sentAt ?? r.createdAt,
        title: r.title,
        data: {
          id: r._id.toString(),
          title: r.title,
          status: r.status,
          analysis: r.analysis?.toString(),
          sentAt: r.sentAt,
          createdAt: r.createdAt,
        },
      })),
    ];
    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }
}
