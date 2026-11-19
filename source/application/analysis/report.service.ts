import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectDisk, StorageDisk } from '@nestjs/storage';
import { Types } from 'mongoose';

import {
  AnalysisStatus,
  DR_LEVEL_DESCRIPTIONS,
  DR_LEVEL_LABELS,
  DR_LEVEL_VALUES,
  ReportStatus,
  type DRLevel,
  SystemRoleEnum,
} from '../../dependencies/enum/index.js';
import type { IUser } from '../../dependencies/interface/index.js';
import { PdfService, type MedicalReportPdf, type PdfImage } from '../../dependencies/service/index.js';
import { GetDoctorProfileQuery } from '../doctor/cqrs/query/index.js';
import { FindPatientByIdQuery, FindPatientByUserQuery } from '../patient/cqrs/query/index.js';
import {
  CreateReportCommand,
  DeleteReportCommand,
  MarkReportViewedCommand,
  SendReportCommand,
  SetReportPdfCommand,
  UpdateReportCommand,
} from './cqrs/command/index.js';
import { FindReportByAnalysisQuery, FindReportQuery, FindReviewQuery, ListReportsQuery } from './cqrs/query/index.js';
import { CreateReportDto, ListReportsDto, UpdateReportDto } from './dto/index.js';
import { type AnalysisView, type Page, ReportEntity, type ReportView, type ReviewView, toReportEntity } from './entity/index.js';
import { REPORT_DELETED_EVENT, REPORT_SENT_EVENT, ReportDeletedEvent, ReportSentEvent } from './event/index.js';
import { AnalysisService, idOf } from './analysis.service.js';

const DISCLAIMER =
  'This report combines the output of an AI screening model with the assessment of the reviewing doctor. AI results support, but do not replace, a full eye examination. Contact your doctor if your vision changes.';

const toneOf = (level: DRLevel): MedicalReportPdf['summary']['tone'] => (level === 0 ? 'ok' : level <= 2 ? 'warn' : 'danger');
const percent = (value: number | null | undefined) => (value === null || value === undefined ? 'n/a' : `${(value * 100).toFixed(1)}%`);
const dateOnly = (date: Date | null | undefined) => (date ? new Date(date).toISOString().slice(0, 10) : 'n/a');

@Injectable()
export class ReportService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly analysisService: AnalysisService,
    private readonly pdfService: PdfService,
    private readonly eventEmitter: EventEmitter2,
    @InjectDisk('private') private readonly disk: StorageDisk,
  ) {}

  get storage(): StorageDisk {
    return this.disk;
  }

  async create(doctor: IUser, { analysisId, title, content, recommendations }: CreateReportDto): Promise<ReportEntity> {
    const analysis = await this.analysisService.findOwned(doctor, new Types.ObjectId(analysisId));
    if (analysis.status !== AnalysisStatus.COMPLETED) throw new BadRequestException('A report can only be generated from a completed analysis');

    const review = await this.queryBus.execute(new FindReviewQuery(analysis._id, idOf(doctor)));
    if (!review) throw new BadRequestException('Review the analysis before writing the report');
    if (!review.notes?.trim() && !content?.trim()) throw new BadRequestException('Add a note to your review or to the report before generating it');
    if (await this.queryBus.execute(new FindReportByAnalysisQuery(analysis._id))) throw new ConflictException('A report for this analysis already exists');

    const reportId = await this.commandBus.execute(new CreateReportCommand(analysis, review._id, { title, content, recommendations }));
    try {
      await this.render(reportId);
    } catch (error) {
      await this.commandBus.execute(new DeleteReportCommand(reportId));
      throw error;
    }
    return toReportEntity(await this.find(reportId));
  }

  async list(user: IUser, { page = 1, size = 20, patientId, status }: ListReportsDto): Promise<Page<ReportEntity>> {
    const isPatient = user.role === SystemRoleEnum.PATIENT;
    let patientUserId: Types.ObjectId | undefined = isPatient ? idOf(user) : undefined;
    if (!isPatient && patientId) {
      const patient = await this.queryBus.execute(new FindPatientByIdQuery(new Types.ObjectId(patientId)));
      if (!patient?.user) throw new NotFoundException('Patient not found');
      patientUserId = patient.user._id;
    }
    const filter = isPatient ? { patientUserId, status: ReportStatus.SENT } : { doctorId: idOf(user), patientUserId, status };
    const result = await this.queryBus.execute(new ListReportsQuery(filter, page, size));
    return { ...result, docs: result.docs.map((report) => toReportEntity(report)) };
  }

  async get(user: IUser, reportId: Types.ObjectId): Promise<ReportEntity> {
    return toReportEntity(await this.findReadable(user, reportId));
  }

  async update(doctor: IUser, reportId: Types.ObjectId, body: UpdateReportDto): Promise<ReportEntity> {
    const report = await this.findOwnedDraft(doctor, reportId);
    const content = body.content ?? report.content;
    if (body.content !== undefined && !content?.trim()) {
      const review = await this.queryBus.execute(new FindReviewQuery(report.analysis, idOf(doctor)));
      if (!review?.notes?.trim()) throw new BadRequestException('Add a note to your review or to the report before generating it');
    }
    const updated = await this.commandBus.execute(new UpdateReportCommand(reportId, body));
    if (!updated) throw new ConflictException('This report has already been sent');
    await this.render(reportId);
    return toReportEntity(await this.find(reportId));
  }

  async regenerate(doctor: IUser, reportId: Types.ObjectId): Promise<ReportEntity> {
    await this.findOwnedDraft(doctor, reportId);
    await this.render(reportId);
    return toReportEntity(await this.find(reportId));
  }

  async send(doctor: IUser, reportId: Types.ObjectId): Promise<ReportEntity> {
    await this.findOwnedDraft(doctor, reportId);
    await this.render(reportId, ReportStatus.SENT);
    const sent = await this.commandBus.execute(new SendReportCommand(reportId));
    if (!sent) throw new ConflictException('This report has already been sent');

    const report = await this.find(reportId);
    this.eventEmitter.emit(REPORT_SENT_EVENT, new ReportSentEvent(reportId.toString(), report.patient._id.toString(), doctor.name));
    return toReportEntity(report);
  }

  async remove(doctor: IUser, reportId: Types.ObjectId): Promise<void> {
    const report = await this.findOwnedDraft(doctor, reportId);
    const deleted = await this.commandBus.execute(new DeleteReportCommand(reportId));
    if (!deleted) throw new ConflictException('This report has already been sent');
    this.eventEmitter.emit(REPORT_DELETED_EVENT, new ReportDeletedEvent(reportId.toString(), report.pdfKey ?? null));
  }

  async download(user: IUser, reportId: Types.ObjectId): Promise<{ key: string; filename: string }> {
    const report = await this.findReadable(user, reportId);
    if (!report.pdfKey) throw new NotFoundException('The report PDF is not available yet');
    if (user.role === SystemRoleEnum.PATIENT && !report.viewedAt) await this.commandBus.execute(new MarkReportViewedCommand(reportId));
    return { key: report.pdfKey, filename: `retinacare-report-${reportId.toString()}.pdf` };
  }

  private async find(reportId: Types.ObjectId): Promise<ReportView> {
    const report = await this.queryBus.execute(new FindReportQuery(reportId));
    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  private async findReadable(user: IUser, reportId: Types.ObjectId): Promise<ReportView> {
    const report = await this.find(reportId);
    const userId = idOf(user);
    if (user.role === SystemRoleEnum.PATIENT) {
      if (!report.patient?._id.equals(userId) || report.status !== ReportStatus.SENT) throw new NotFoundException('Report not found');
      return report;
    }
    if (!report.doctor?._id.equals(userId)) throw new ForbiddenException('You can only change your own reports');
    return report;
  }

  private async findOwnedDraft(doctor: IUser, reportId: Types.ObjectId): Promise<ReportView> {
    const report = await this.find(reportId);
    if (!report.doctor?._id.equals(idOf(doctor))) throw new ForbiddenException('You can only change your own reports');
    if (report.status !== ReportStatus.DRAFT) throw new ConflictException('This report has already been sent');
    return report;
  }

  private async render(reportId: Types.ObjectId, status?: ReportStatus): Promise<void> {
    const report = await this.find(reportId);
    const doctor = { _id: report.doctor._id, name: report.doctor.name } as IUser;
    const analysis = await this.analysisService.findOwned(doctor, report.analysis);
    const review = await this.queryBus.execute(new FindReviewQuery(analysis._id, report.doctor._id));
    if (!review) throw new BadRequestException('Review the analysis before writing the report');

    const pdf = await this.pdfService.renderMedicalReport(await this.buildPdf(report, analysis, review, status ?? report.status));
    const key = `reports/${reportId.toString()}.pdf`;
    await this.disk.put(key, pdf, { contentType: 'application/pdf' });
    await this.commandBus.execute(new SetReportPdfCommand(reportId, key, pdf.length));
  }

  private async buildPdf(report: ReportView, analysis: AnalysisView, review: ReviewView, status: ReportStatus): Promise<MedicalReportPdf> {
    const [patient, clinic] = await Promise.all([
      this.queryBus.execute(new FindPatientByUserQuery(report.patient._id)),
      this.queryBus.execute(new GetDoctorProfileQuery(report.doctor._id)),
    ]);
    const level = review.confirmedLevel;
    const findings = analysis.findings ?? [];
    const recommendations = report.recommendations || review.recommendations;
    const notes = [review.notes, report.content].filter((text): text is string => !!text?.trim()).join('\n\n');

    return {
      reference: `RC-${reportId(report)}`,
      title: report.title,
      issuedAt: report.sentAt ?? new Date(),
      patient: {
        name: report.patient.name,
        details: [
          patient?.medicalRecordNumber && `MRN ${patient.medicalRecordNumber}`,
          patient?.dateOfBirth && `Born ${dateOnly(patient.dateOfBirth)}`,
          patient?.gender && `Gender ${patient.gender}`,
          analysis.image?.eye && `Eye ${analysis.image.eye}`,
        ].filter((line): line is string => !!line),
      },
      doctor: {
        name: `Dr. ${report.doctor.name}`,
        details: [clinic?.specialty, clinic?.clinicName, clinic?.clinicAddress].filter((line): line is string => !!line),
      },
      images: await this.images(analysis),
      summary: {
        heading: DR_LEVEL_LABELS[level],
        tone: toneOf(level),
        text: DR_LEVEL_DESCRIPTIONS[level],
        scale: { labels: DR_LEVEL_VALUES.map((value) => DR_LEVEL_LABELS[value]), active: level },
      },
      sections: [
        {
          heading: 'AI screening (stage 1: diabetic retinopathy detection)',
          rows: [
            { label: 'Result', value: analysis.hasDR ? 'Signs of diabetic retinopathy detected' : 'No diabetic retinopathy detected' },
            { label: 'Confidence', value: percent(analysis.stage1Confidence) },
            { label: 'Model', value: `${analysis.modelVersion ?? 'n/a'}${analysis.isMock ? ' (mock)' : ''}` },
            { label: 'Analysed on', value: dateOnly(analysis.completedAt) },
          ],
          bars: findings.map((finding) => ({ label: finding.name, value: finding.probability, highlight: finding.detected, marker: finding.threshold })),
        },
        {
          heading: 'AI grading (stage 2: severity level)',
          rows: [
            analysis.predictedLevel !== null && analysis.predictedLevel !== undefined
              ? { label: 'Predicted level', value: `${DR_LEVEL_LABELS[analysis.predictedLevel]} (${percent(analysis.confidence)})` }
              : { label: 'Predicted level', value: 'Not available: the grading model is not deployed yet' },
          ],
        },
        {
          heading: "Doctor's review",
          rows: [
            { label: 'AI result confirmed', value: review.aiResultConfirmed ? 'Yes' : 'No' },
            { label: 'Confirmed level', value: DR_LEVEL_LABELS[level] },
            { label: 'Follow-up', value: dateOnly(review.followUpDate) },
          ],
          ...(notes && { text: notes }),
        },
        ...(recommendations ? [{ heading: 'Recommendations', text: recommendations }] : []),
      ],
      disclaimer: DISCLAIMER,
      badge: status === ReportStatus.DRAFT ? { text: 'DRAFT', tone: 'warn' } : { text: 'FINAL', tone: 'ok' },
      signature: { name: `Dr. ${report.doctor.name}`, title: clinic?.specialty ?? 'Reviewing doctor', date: review.updatedAt ?? new Date() },
      ...(status === ReportStatus.DRAFT && { watermark: 'DRAFT' }),
    };
  }

  private async images(analysis: AnalysisView): Promise<PdfImage[]> {
    const sources: [string, string | null | undefined][] = [
      ['Fundus image', analysis.image?.storageKey],
      ['AI attention map (Grad-CAM)', analysis.gradCamKey],
    ];
    const images = await Promise.all(sources.map(async ([caption, key]) => (key ? { caption, data: await this.disk.getBuffer(key).catch(() => null) } : null)));
    return images.filter((image): image is PdfImage => !!image?.data);
  }
}

const reportId = (report: ReportView) => report._id.toString().slice(-8).toUpperCase();
