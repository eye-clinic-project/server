import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { HUserDocument } from '../../database/model/user.model.js';
import { DoctorReviewRepository } from '../../database/repository/doctor-review.repository.js';
import { AnalysisRepository } from '../../database/repository/analysis.repository.js';
import { AccessService } from '../../dependency/service/access.service.js';
import { NotifierService } from '../../dependency/service/notifier.service.js';
import { isDuplicateKeyError } from '../../dependency/service/profile.service.js';
import { AnalysisStatus, DR_LEVEL_LABELS, DRLevel, NotificationType } from '../../dependency/enum/database.enum.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { presentUser } from '../../dependency/presenter.js';
import { CreateDoctorReviewDto, DoctorReviewQueryDto, UpdateDoctorReviewDto } from './dto/doctor-review.dto.js';

@Injectable()
export class DoctorReviewService {
  constructor(
    private readonly reviews: DoctorReviewRepository,
    private readonly analyses: AnalysisRepository,
    private readonly access: AccessService,
    private readonly notifier: NotifierService,
  ) {}

  private present(r: any) {
    return {
      id: r._id.toString(),
      _id: r._id.toString(),
      analysis: r.analysis?._id?.toString?.() ?? r.analysis?.toString(),
      patient: r.patient && typeof r.patient === 'object' && 'email' in r.patient ? presentUser(r.patient) : r.patient?.toString(),
      doctor: r.doctor && typeof r.doctor === 'object' && 'email' in r.doctor ? presentUser(r.doctor) : r.doctor?.toString(),
      aiResultConfirmed: r.aiResultConfirmed,
      confirmedLevel: r.confirmedLevel,
      confirmedLabel: DR_LEVEL_LABELS[r.confirmedLevel as DRLevel],
      notes: r.notes,
      recommendations: r.recommendations,
      followUpDate: r.followUpDate ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }

  private async notifyFollowUp(patient: Types.ObjectId, reviewId: Types.ObjectId, date?: Date | null) {
    if (!date) return;
    await this.notifier.notify({
      recipient: patient,
      type: NotificationType.FOLLOW_UP,
      title: 'Follow-up visit recommended',
      body: `Your doctor recommends a follow-up on ${date.toISOString().slice(0, 10)}.`,
      link: '/patient/appointments',
      resourceId: reviewId,
    });
  }

  async create(doctor: HUserDocument, dto: CreateDoctorReviewDto) {
    const analysis = await this.analyses.findById({ _id: dto.analysisId });
    if (!analysis) throw new NotFoundException('Analysis not found');
    await this.access.assertTreatingDoctor(doctor, analysis.patient);
    if (analysis.status !== AnalysisStatus.COMPLETED) {
      throw new BadRequestException('Only completed analyses can be reviewed');
    }
    const { analysisId: _analysisId, ...fields } = dto;
    try {
      const review = await this.reviews.create({
        data: { ...fields, analysis: analysis._id, doctor: doctor._id, patient: analysis.patient },
      });
      await this.notifyFollowUp(analysis.patient, review._id, dto.followUpDate);
      return this.findOne(doctor, review._id);
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('You already reviewed this analysis. Update your review instead.');
      }
      throw error;
    }
  }

  async list(viewer: HUserDocument, query: DoctorReviewQueryDto) {
    const filter: Record<string, any> = await this.access.patientFilter(viewer);
    if (query.patientId) {
      const id = new Types.ObjectId(query.patientId);
      await this.access.assertCanAccessPatient(viewer, id);
      filter.patient = id;
    }
    if (query.analysisId) filter.analysis = new Types.ObjectId(query.analysisId);
    const page = await this.reviews.paginate({
      filter,
      options: { sort: { createdAt: -1 }, populate: [{ path: 'doctor' }, { path: 'patient' }], lean: true },
      page: query.page,
      size: query.size,
    });
    return { items: page.docs.map((r) => this.present(r)), total: page.count, page: page.currentPage, size: page.size, pages: page.pages };
  }

  async findOne(viewer: HUserDocument, id: Types.ObjectId) {
    const review = await this.reviews.findById({ _id: id, options: { populate: [{ path: 'doctor' }, { path: 'patient' }], lean: true } });
    await this.access.assertDocumentAccess(viewer, review as any, 'Review');
    return this.present(review);
  }

  private async loadOwn(doctor: HUserDocument, id: Types.ObjectId) {
    const review = await this.reviews.findById({ _id: id });
    if (!review) throw new NotFoundException('Review not found');
    if (!review.doctor.equals(doctor._id) && doctor.role !== SystemRoleEnum.ADMIN) {
      throw new ForbiddenException('You can only change your own reviews');
    }
    return review;
  }

  async update(doctor: HUserDocument, id: Types.ObjectId, dto: UpdateDoctorReviewDto) {
    const review = await this.loadOwn(doctor, id);
    const { analysisId: _ignored, ...fields } = dto as UpdateDoctorReviewDto & { analysisId?: string };
    await this.reviews.updateOne({ filter: { _id: id }, update: { $set: fields } });
    if (dto.followUpDate && dto.followUpDate.getTime() !== review.followUpDate?.getTime()) {
      await this.notifyFollowUp(review.patient, review._id, dto.followUpDate);
    }
    return this.findOne(doctor, id);
  }

  async remove(doctor: HUserDocument, id: Types.ObjectId) {
    await this.loadOwn(doctor, id);
    await this.reviews.deleteOne({ filter: { _id: id } });
    return { deleted: true };
  }
}
