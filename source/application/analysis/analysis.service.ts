import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectDisk, StorageDisk, type StoredUpload } from '@nestjs/storage';
import { Types } from 'mongoose';

import { AnalysisStatus, ReportStatus } from '../../dependencies/enum/database.enum.js';
import type { IUser } from '../../dependencies/interface/database.interface.js';
import { AiService, sha256, type AiHealth } from './ai.service.js';
import { FindPatientByIdQuery } from '../patient/custom/query/find-patient-by-id.query.js';
import { IsPatientAssignedQuery } from '../patient/custom/query/is-patient-assigned.query.js';
import { CreateAnalysisCommand } from './custom/command/create-analysis.command.js';
import { CreateReviewCommand } from './custom/command/create-review.command.js';
import { DeleteAnalysisCommand } from './custom/command/delete-analysis.command.js';
import { RetryAnalysisCommand } from './custom/command/retry-analysis.command.js';
import { UpdateReviewCommand } from './custom/command/update-review.command.js';
import { FindAnalysisQuery } from './custom/query/find-analysis.query.js';
import { FindReportByAnalysisQuery } from './custom/query/find-report-by-analysis.query.js';
import { FindReviewQuery } from './custom/query/find-review.query.js';
import { ListAnalysesQuery } from './custom/query/list-analyses.query.js';
import { CreateAnalysisDto } from './dto/create-analysis.dto.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { ListAnalysesDto } from './dto/list-analyses.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';
import { AnalysisEntity, toAnalysisEntity } from './entity/analysis.entity.js';
import type { AnalysisView, Page } from './type/analysis.type.js';
import { ReviewEntity, toReviewEntity } from './entity/review.entity.js';
import { ANALYSIS_DELETED_EVENT, AnalysisDeletedEvent } from './event/analysis-deleted.event.js';
import { ANALYSIS_REQUESTED_EVENT, AnalysisRequestedEvent } from './event/analysis-requested.event.js';

@Injectable()
export class AnalysisService {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventEmitter: EventEmitter2,
    private readonly aiService: AiService,
    @InjectDisk('private') private readonly disk: StorageDisk,
  ) {}

  get storage(): StorageDisk {
    return this.disk;
  }

  health(): Promise<AiHealth> {
    return this.aiService.health();
  }

  async create(doctor: IUser, file: StoredUpload, { patientId, eye, notes, capturedAt }: CreateAnalysisDto): Promise<AnalysisEntity> {
    const doctorId = idOf(doctor);
    try {
      const patient = await this.queryBus.execute(new FindPatientByIdQuery(new Types.ObjectId(patientId)));
      if (!patient?.user || patient.user.isActive === false) throw new NotFoundException('Patient not found');
      const assigned = await this.queryBus.execute(new IsPatientAssignedQuery(doctorId, patient.user._id));
      if (!assigned) throw new ForbiddenException('Analyses are only available between a doctor and their assigned patient');

      const data = await this.disk.getBuffer(file.key);
      const analysisId = await this.commandBus.execute(
        new CreateAnalysisCommand(doctorId, patient.user._id, {
          storageKey: file.key,
          mimeType: file.contentType,
          size: file.size,
          sha256: sha256(data),
          originalName: file.originalname?.slice(0, 200),
          eye,
          notes,
          capturedAt,
        }),
      );
      this.eventEmitter.emit(ANALYSIS_REQUESTED_EVENT, new AnalysisRequestedEvent(analysisId.toString(), doctorId.toString()));
      return toAnalysisEntity(await this.findOwned(doctor, analysisId));
    } catch (error) {
      await this.disk.delete(file.key).catch(() => undefined);
      throw error;
    }
  }

  async list(doctor: IUser, { page = 1, size = 20, patientId, status, hasDR, reviewed }: ListAnalysesDto): Promise<Page<AnalysisEntity>> {
    let patientUserId: Types.ObjectId | undefined;
    if (patientId) {
      const patient = await this.queryBus.execute(new FindPatientByIdQuery(new Types.ObjectId(patientId)));
      if (!patient?.user) throw new NotFoundException('Patient not found');
      patientUserId = patient.user._id;
    }
    const result = await this.queryBus.execute(new ListAnalysesQuery({ doctorId: idOf(doctor), patientUserId, status, hasDR, reviewed }, page, size));
    return { ...result, docs: result.docs.map((analysis) => toAnalysisEntity(analysis)) };
  }

  async get(doctor: IUser, analysisId: Types.ObjectId): Promise<AnalysisEntity> {
    return toAnalysisEntity(await this.findOwned(doctor, analysisId));
  }

  async retry(doctor: IUser, analysisId: Types.ObjectId): Promise<AnalysisEntity> {
    const analysis = await this.findOwned(doctor, analysisId);
    if (analysis.status !== AnalysisStatus.FAILED) throw new BadRequestException('Only failed analyses can be retried');
    const retried = await this.commandBus.execute(new RetryAnalysisCommand(analysisId, idOf(doctor)));
    if (!retried) throw new ConflictException('This analysis is already being processed');
    this.eventEmitter.emit(ANALYSIS_REQUESTED_EVENT, new AnalysisRequestedEvent(analysisId.toString(), idOf(doctor).toString()));
    return toAnalysisEntity(await this.findOwned(doctor, analysisId));
  }

  async remove(doctor: IUser, analysisId: Types.ObjectId): Promise<void> {
    const analysis = await this.findOwned(doctor, analysisId);
    if (analysis.status === AnalysisStatus.PROCESSING) throw new ConflictException('This analysis is already being processed');
    if (await this.queryBus.execute(new FindReportByAnalysisQuery(analysisId)))
      throw new ConflictException('Delete the reports generated from this analysis first');

    const keys = await this.commandBus.execute(new DeleteAnalysisCommand(analysisId));
    this.eventEmitter.emit(ANALYSIS_DELETED_EVENT, new AnalysisDeletedEvent(analysisId.toString(), keys));
  }

  async imageKey(doctor: IUser, analysisId: Types.ObjectId): Promise<string> {
    const analysis = await this.findOwned(doctor, analysisId);
    if (!analysis.image?.storageKey) throw new NotFoundException('Image not found');
    return analysis.image.storageKey;
  }

  async gradCamKey(doctor: IUser, analysisId: Types.ObjectId): Promise<string> {
    const analysis = await this.findOwned(doctor, analysisId);
    if (!analysis.gradCamKey) throw new NotFoundException('Grad-CAM heatmap is not available for this analysis');
    return analysis.gradCamKey;
  }

  async getReview(doctor: IUser, analysisId: Types.ObjectId): Promise<ReviewEntity> {
    await this.findOwned(doctor, analysisId);
    const review = await this.queryBus.execute(new FindReviewQuery(analysisId, idOf(doctor)));
    if (!review) throw new NotFoundException('Review not found');
    return toReviewEntity(review);
  }

  async createReview(doctor: IUser, analysisId: Types.ObjectId, body: CreateReviewDto): Promise<ReviewEntity> {
    const analysis = await this.findOwned(doctor, analysisId);
    if (analysis.status !== AnalysisStatus.COMPLETED) throw new BadRequestException('Only completed analyses can be reviewed');
    if (await this.queryBus.execute(new FindReviewQuery(analysisId, idOf(doctor))))
      throw new ConflictException('You already reviewed this analysis. Update your review instead.');
    return toReviewEntity(await this.commandBus.execute(new CreateReviewCommand(analysis, body)));
  }

  async updateReview(doctor: IUser, analysisId: Types.ObjectId, body: UpdateReviewDto): Promise<ReviewEntity> {
    await this.findOwned(doctor, analysisId);
    const review = await this.queryBus.execute(new FindReviewQuery(analysisId, idOf(doctor)));
    if (!review) throw new NotFoundException('Review not found');
    const report = await this.queryBus.execute(new FindReportByAnalysisQuery(analysisId));
    if (report?.status === ReportStatus.SENT) throw new ConflictException('The report was already sent, so the review can no longer be changed');

    const updated = await this.commandBus.execute(new UpdateReviewCommand(review._id, body));
    if (!updated) throw new NotFoundException('Review not found');
    return toReviewEntity(updated);
  }

  async findOwned(doctor: IUser, analysisId: Types.ObjectId): Promise<AnalysisView> {
    const analysis = await this.queryBus.execute(new FindAnalysisQuery(analysisId));
    if (!analysis) throw new NotFoundException('Analysis not found');
    if (!analysis.doctor.equals(idOf(doctor))) throw new ForbiddenException('You do not have access to this analysis');
    return analysis;
  }
}

export const idOf = (user: IUser): Types.ObjectId => new Types.ObjectId(user._id);
