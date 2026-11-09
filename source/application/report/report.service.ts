import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { HUserDocument } from '../../database/model/user.model.js';
import { ReportRepository } from '../../database/repository/report.repository.js';
import { AnalysisRepository } from '../../database/repository/analysis.repository.js';
import { DoctorReviewRepository } from '../../database/repository/doctor-review.repository.js';
import { PatientRepository } from '../../database/repository/patient.repository.js';
import { DoctorRepository } from '../../database/repository/doctor.repository.js';
import { FundusImageRepository } from '../../database/repository/fundus-image.repository.js';
import { AccessService } from '../../dependency/service/access.service.js';
import { NotifierService } from '../../dependency/service/notifier.service.js';
import { PdfService } from '../../dependency/service/pdf.service.js';
import { StorageService } from '../../dependency/service/storage.service.js';
import {
  AnalysisStatus,
  DR_LEVEL_DESCRIPTIONS,
  DR_LEVEL_LABELS,
  DRLevel,
  NotificationType,
  ReportStatus,
} from '../../dependency/enum/database.enum.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { AI_DISCLAIMER } from '../../dependency/constant.js';
import { presentAnalysis, presentUser } from '../../dependency/presenter.js';
import { CreateReportDto, ReportQueryDto, UpdateReportDto } from './dto/report.dto.js';

@Injectable()
export class ReportService {
  constructor(
    private readonly reports: ReportRepository,
    private readonly analyses: AnalysisRepository,
    private readonly reviews: DoctorReviewRepository,
    private readonly patients: PatientRepository,
    private readonly doctors: DoctorRepository,
    private readonly images: FundusImageRepository,
    private readonly access: AccessService,
    private readonly notifier: NotifierService,
    private readonly pdf: PdfService,
    private readonly storage: StorageService,
  ) {}

  private summary(r: any) {
    return {
      id: r._id.toString(),
      _id: r._id.toString(),
      title: r.title,
      status: r.status,
      sentAt: r.sentAt ?? null,
      viewedAt: r.viewedAt ?? null,
      doctor: r.doctor && typeof r.doctor === 'object' && 'email' in r.doctor ? presentUser(r.doctor) : r.doctor?.toString(),
      patient: r.patient && typeof r.patient === 'object' && 'email' in r.patient ? presentUser(r.patient) : r.patient?.toString(),
      analysis: r.analysis?._id?.toString?.() ?? r.analysis?.toString(),
      pdfUrl: `/api/v1/reports/${r._id.toString()}/pdf`,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  /** FR4.3: report with patient details, image, grade, heatmap, doctor notes. */
  async create(doctor: HUserDocument, dto: CreateReportDto) {
    const analysis = await this.analyses.findById({ _id: dto.analysisId });
    if (!analysis) throw new NotFoundException('Analysis not found');
    await this.access.assertTreatingDoctor(doctor, analysis.patient);
    if (analysis.status !== AnalysisStatus.COMPLETED) {
      throw new BadRequestException('A report can only be generated from a completed analysis');
    }
    const review = await this.reviews.findOne({ filter: { analysis: analysis._id, doctor: doctor._id } });
    const date = (analysis.createdAt ?? new Date()).toISOString().slice(0, 10);
    const report = await this.reports.create({
      data: {
        doctor: doctor._id,
        patient: analysis.patient,
        analysis: analysis._id,
        review: review?._id ?? null,
        title: dto.title ?? `Diabetic retinopathy screening report – ${date}`,
        content: dto.content ?? review?.notes,
        recommendations: dto.recommendations ?? review?.recommendations,
        status: ReportStatus.DRAFT,
      },
    });
    return this.findOne(doctor, report._id);
  }

  async list(viewer: HUserDocument, query: ReportQueryDto) {
    const filter: Record<string, any> = await this.access.patientFilter(viewer);
    if (query.patientId) {
      const id = new Types.ObjectId(query.patientId);
      await this.access.assertCanAccessPatient(viewer, id);
      filter.patient = id;
    }
    if (query.status) filter.status = query.status;
    // Patients only see reports that were sent to them (FR4.4).
    if (viewer.role === SystemRoleEnum.PATIENT) filter.status = ReportStatus.SENT;
    const page = await this.reports.paginate({
      filter,
      options: { sort: { createdAt: -1 }, populate: [{ path: 'doctor' }, { path: 'patient' }], lean: true },
      page: query.page,
      size: query.size,
    });
    return { items: page.docs.map((r) => this.summary(r)), total: page.count, page: page.currentPage, size: page.size, pages: page.pages };
  }

  private async load(viewer: HUserDocument, id: Types.ObjectId) {
    const report = await this.reports.findById({ _id: id });
    await this.access.assertDocumentAccess(viewer, report, 'Report');
    if (viewer.role === SystemRoleEnum.PATIENT && report!.status !== ReportStatus.SENT) {
      throw new NotFoundException('Report not found');
    }
    return report!;
  }

  async findOne(viewer: HUserDocument, id: Types.ObjectId) {
    const base = await this.load(viewer, id);
    if (viewer.role === SystemRoleEnum.PATIENT && !base.viewedAt) {
      await this.reports.updateOne({ filter: { _id: id }, update: { $set: { viewedAt: new Date() } } });
    }
    const report: any = await this.reports.findById({
      _id: id,
      options: { populate: [{ path: 'doctor' }, { path: 'patient' }, { path: 'review' }], lean: true },
    });
    const analysis = await this.analyses.findById({
      _id: report.analysis,
      projection: '-history +gradCamKey',
      options: { populate: [{ path: 'image' }], lean: true },
    });
    const [patientProfile, doctorProfile] = await Promise.all([
      this.patients.findOne({ filter: { user: report.patient._id }, options: { lean: true } }),
      this.doctors.findOne({ filter: { user: report.doctor._id }, options: { lean: true } }),
    ]);
    return {
      ...this.summary(report),
      content: report.content ?? '',
      recommendations: report.recommendations ?? '',
      patientProfile,
      doctorProfile,
      review: report.review
        ? {
            id: report.review._id.toString(),
            aiResultConfirmed: report.review.aiResultConfirmed,
            confirmedLevel: report.review.confirmedLevel,
            confirmedLabel: DR_LEVEL_LABELS[report.review.confirmedLevel as DRLevel],
            followUpDate: report.review.followUpDate ?? null,
          }
        : null,
      analysis: presentAnalysis(analysis),
      disclaimer: AI_DISCLAIMER,
    };
  }

  private async loadOwnDoctor(doctor: HUserDocument, id: Types.ObjectId) {
    const report = await this.reports.findById({ _id: id });
    if (!report) throw new NotFoundException('Report not found');
    if (doctor.role !== SystemRoleEnum.ADMIN && !report.doctor.equals(doctor._id)) {
      throw new ForbiddenException('You can only change your own reports');
    }
    return report;
  }

  async update(doctor: HUserDocument, id: Types.ObjectId, dto: UpdateReportDto) {
    await this.loadOwnDoctor(doctor, id);
    await this.reports.updateOne({ filter: { _id: id }, update: { $set: dto } });
    return this.findOne(doctor, id);
  }

  async remove(doctor: HUserDocument, id: Types.ObjectId) {
    await this.loadOwnDoctor(doctor, id);
    await this.reports.deleteOne({ filter: { _id: id } });
    return { deleted: true };
  }

  /** FR4.4: make the report visible to the patient and notify them (in-app + email). */
  async send(doctor: HUserDocument, id: Types.ObjectId) {
    const report = await this.loadOwnDoctor(doctor, id);
    await this.access.assertTreatingDoctor(doctor, report.patient);
    const resend = report.status === ReportStatus.SENT;
    await this.reports.updateOne({
      filter: { _id: id },
      update: { $set: { status: ReportStatus.SENT, sentAt: new Date() } },
    });
    await this.notifier.notify({
      recipient: report.patient,
      type: NotificationType.REPORT,
      title: resend ? 'Your medical report was updated' : 'A new medical report is available',
      body: `Dr. ${doctor.name} sent you a report: ${report.title}`,
      link: `/patient/reports/${id.toString()}`,
      resourceId: id,
      email: true,
    });
    return this.findOne(doctor, id);
  }

  /** FR4.5: PDF with the same content as the on-screen report. */
  async renderPdf(viewer: HUserDocument, id: Types.ObjectId) {
    const view = await this.findOne(viewer, id);
    const analysis: any = await this.analyses.findById({ _id: view.analysis!.id, projection: '+gradCamKey' });
    const image = analysis ? await this.images.findById({ _id: analysis.image, projection: '+storageKey' }) : null;
    const [imageData, gradCam] = await Promise.all([
      image ? this.storage.read(image.storageKey).catch(() => null) : null,
      analysis?.gradCamKey ? this.storage.read(analysis.gradCamKey).catch(() => null) : null,
    ]);
    const patient = view.patient as any;
    const doctor = view.doctor as any;
    const result = view.analysis?.result;
    const buffer = await this.pdf.renderReport({
      reportId: view.id,
      title: view.title,
      status: view.status,
      createdAt: view.createdAt,
      sentAt: view.sentAt,
      patient: {
        name: patient?.name,
        email: patient?.email,
        medicalRecordNumber: (view.patientProfile as any)?.medicalRecordNumber,
        dateOfBirth: (view.patientProfile as any)?.dateOfBirth,
        gender: (view.patientProfile as any)?.gender,
      },
      doctor: {
        name: doctor?.name,
        clinicName: (view.doctorProfile as any)?.clinicName,
        specialty: (view.doctorProfile as any)?.specialty,
      },
      analysis: {
        date: view.analysis!.createdAt,
        eye: (image as any)?.eye,
        statusLabel: view.analysis!.status,
        hasDR: result?.hasDR,
        gradeLabel: result?.gradeLabel,
        gradeDescription: result?.predictedLevel != null ? DR_LEVEL_DESCRIPTIONS[result.predictedLevel as DRLevel] : null,
        confidence: result?.confidence,
        modelVersion: result?.modelVersion,
        isMock: result?.isMock,
      },
      review: view.review,
      notes: view.content,
      recommendations: view.recommendations,
      image: imageData,
      gradCam,
      disclaimer: AI_DISCLAIMER,
    });
    return { buffer, filename: `report-${view.id}.pdf` };
  }
}
