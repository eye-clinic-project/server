import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import type { HUserDocument } from '../../database/model/user.model.js';
import { AnalysisRepository } from '../../database/repository/analysis.repository.js';
import { FundusImageRepository } from '../../database/repository/fundus-image.repository.js';
import { DoctorReviewRepository } from '../../database/repository/doctor-review.repository.js';
import { ReportRepository } from '../../database/repository/report.repository.js';
import { AccessService } from '../../dependency/service/access.service.js';
import { AiService } from '../../dependency/service/ai.service.js';
import { StorageService } from '../../dependency/service/storage.service.js';
import { NotifierService } from '../../dependency/service/notifier.service.js';
import { AnalysisStatus, NotificationType } from '../../dependency/enum/database.enum.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { presentAnalysis } from '../../dependency/presenter.js';
import { Localize } from '../../dependency/language/localize.js';
import { AnalysisQueryDto } from './dto/analysis.dto.js';

/** A run stuck in "processing" longer than this is considered dead and may be retried. */
const STALE_PROCESSING_MS = 2 * 60 * 1000;

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly analyses: AnalysisRepository,
    private readonly images: FundusImageRepository,
    private readonly reviews: DoctorReviewRepository,
    private readonly reports: ReportRepository,
    private readonly access: AccessService,
    private readonly ai: AiService,
    private readonly storage: StorageService,
    private readonly notifier: NotifierService,
  ) {}

  private populated(id: Types.ObjectId) {
    return this.analyses.findById({
      _id: id,
      projection: '+gradCamKey',
      options: { populate: [{ path: 'patient' }, { path: 'doctor' }, { path: 'image' }], lean: true },
    });
  }

  private async load(viewer: HUserDocument, id: Types.ObjectId) {
    const analysis = await this.analyses.findById({ _id: id, projection: '+gradCamKey' });
    return this.access.assertDocumentAccess(viewer, analysis, 'Analysis');
  }

  /** Creates a pending analysis for an image (no prediction yet). */
  async create(doctor: HUserDocument, imageId: Types.ObjectId) {
    const image = await this.images.findById({ _id: imageId });
    if (!image) throw new NotFoundException('Image not found');
    await this.access.assertTreatingDoctor(doctor, image.patient);
    const analysis = await this.analyses.create({
      data: {
        doctor: doctor._id,
        patient: image.patient,
        image: image._id,
        status: AnalysisStatus.PENDING,
        attempts: 0,
        history: [{ status: AnalysisStatus.PENDING, message: 'Analysis created', at: new Date(), by: doctor._id }],
      },
    });
    return presentAnalysis(await this.populated(analysis._id));
  }

  /**
   * Sends the original image to the AI service and stores the result (FR3.2 – FR3.6).
   * Failures are recorded on the analysis (status = failed, error message) so the client
   * can show the error and offer a retry.
   */
  async run(actor: HUserDocument | null, id: Types.ObjectId, opts: { notify?: boolean } = {}) {
    const existing = await this.analyses.findById({ _id: id });
    if (!existing) throw new NotFoundException('Analysis not found');
    if (actor) await this.access.assertTreatingDoctor(actor, existing.patient);
    if (existing.status === AnalysisStatus.COMPLETED) {
      throw new ConflictException('This analysis is already completed');
    }

    // Claim the analysis atomically so two requests cannot run it at the same time.
    const claimed = await this.analyses.findOneAndUpdate({
      filter: {
        _id: id,
        $or: [
          { status: { $in: [AnalysisStatus.PENDING, AnalysisStatus.FAILED] } },
          { status: AnalysisStatus.PROCESSING, updatedAt: { $lt: new Date(Date.now() - STALE_PROCESSING_MS) } },
        ],
      },
      update: {
        $set: { status: AnalysisStatus.PROCESSING, error: null },
        $inc: { attempts: 1 },
        $push: { history: { status: AnalysisStatus.PROCESSING, message: 'Sent to AI service', at: new Date(), by: actor?._id ?? null } },
      },
    });
    if (!claimed) throw new ConflictException('This analysis is already being processed');

    const image = await this.images.findById({ _id: claimed.image, projection: '+storageKey' });
    if (!image) {
      await this.fail(id, 'The fundus image no longer exists');
      return presentAnalysis(await this.populated(id));
    }

    const started = Date.now();
    try {
      const data = await this.storage.read(image.storageKey);
      if (StorageService.sha256(data) !== image.sha256) {
        throw new Error('Stored image failed its integrity check');
      }
      const prediction = await this.ai.predict(data, image.mimeType);
      const gradCamKey = prediction.gradCam
        ? await this.storage.save('gradcam', prediction.gradCam.data, prediction.gradCam.mimeType === 'image/png' ? 'png' : 'jpg')
        : null;

      await this.analyses.updateOne({
        filter: { _id: id },
        update: {
          $set: {
            status: AnalysisStatus.COMPLETED,
            hasDR: prediction.hasDR,
            stage1Confidence: prediction.stage1Confidence,
            predictedLevel: prediction.predictedLevel,
            confidence: prediction.confidence,
            probabilities: prediction.probabilities,
            gradCamKey,
            modelVersion: prediction.modelVersion,
            isMock: prediction.isMock,
            processingMs: Date.now() - started,
            completedAt: new Date(),
            error: null,
          },
          $push: { history: { status: AnalysisStatus.COMPLETED, message: `Completed by ${prediction.modelVersion}`, at: new Date() } },
        },
      });

      if (opts.notify !== false) {
        await this.notifier.notify({
          recipient: claimed.patient,
          type: NotificationType.ANALYSIS,
          title: 'A new eye screening result is available',
          body: 'Your fundus image has been analysed. Your doctor will review the result.',
          link: `/patient/results/${id.toString()}`,
          resourceId: id,
          email: true,
        });
      }
    } catch (error) {
      const message =
        error instanceof HttpException ? error.message : 'The AI analysis failed. Please retry.';
      if (!(error instanceof HttpException)) {
        this.logger.error(`Analysis ${id.toString()} failed: ${(error as Error).message}`);
      }
      await this.fail(id, message);
    }
    return presentAnalysis(await this.populated(id));
  }

  private async fail(id: Types.ObjectId, message: string) {
    await this.analyses.updateOne({
      filter: { _id: id },
      update: {
        $set: { status: AnalysisStatus.FAILED, error: message },
        $push: { history: { status: AnalysisStatus.FAILED, message, at: new Date() } },
      },
    });
  }

  async retry(actor: HUserDocument, id: Types.ObjectId) {
    const analysis = await this.load(actor, id);
    if (analysis.status !== AnalysisStatus.FAILED) {
      throw new BadRequestException('Only failed analyses can be retried');
    }
    return this.run(actor, id);
  }

  async list(viewer: HUserDocument, query: AnalysisQueryDto) {
    const filter: Record<string, any> = await this.access.patientFilter(viewer);
    if (query.patientId) {
      const patientId = new Types.ObjectId(query.patientId);
      await this.access.assertCanAccessPatient(viewer, patientId);
      filter.patient = patientId;
    }
    if (query.imageId) filter.image = new Types.ObjectId(query.imageId);
    if (query.status) filter.status = query.status;

    const page = await this.analyses.paginate({
      filter,
      projection: '-history +gradCamKey',
      options: {
        sort: { createdAt: -1 },
        populate: [{ path: 'patient' }, { path: 'doctor' }, { path: 'image' }],
        lean: true,
      },
      page: query.page,
      size: query.size,
    });
    return {
      items: page.docs.map((a) => presentAnalysis(a)),
      total: page.count,
      page: page.currentPage,
      size: page.size,
      pages: page.pages,
    };
  }

  async findOne(viewer: HUserDocument, id: Types.ObjectId) {
    await this.load(viewer, id);
    const [analysis, reviews] = await Promise.all([
      this.populated(id),
      this.reviews.find({ filter: { analysis: id }, options: { populate: [{ path: 'doctor' }], lean: true } }),
    ]);
    return {
      ...presentAnalysis(analysis),
      reviews: reviews.map((r: any) => ({
        id: r._id.toString(),
        doctor: r.doctor ? { id: r.doctor._id.toString(), name: r.doctor.name } : null,
        aiResultConfirmed: r.aiResultConfirmed,
        confirmedLevel: r.confirmedLevel,
        notes: r.notes,
        recommendations: r.recommendations,
        followUpDate: r.followUpDate,
        createdAt: r.createdAt,
      })),
    };
  }

  async result(viewer: HUserDocument, id: Types.ObjectId) {
    const analysis = await this.load(viewer, id);
    const view = presentAnalysis(await this.populated(id))!;
    if (analysis.status !== AnalysisStatus.COMPLETED) {
      return { status: view.status, ready: false, error: view.error, disclaimer: view.disclaimer };
    }
    return { status: view.status, ready: true, ...view.result, disclaimer: view.disclaimer };
  }

  async gradCam(viewer: HUserDocument | null, id: Types.ObjectId) {
    const analysis = viewer
      ? await this.load(viewer, id)
      : await this.analyses.findById({ _id: id, projection: '+gradCamKey' });
    if (!analysis?.gradCamKey) throw new NotFoundException('Grad-CAM heatmap is not available for this analysis');
    return {
      data: await this.storage.read(analysis.gradCamKey),
      mimeType: analysis.gradCamKey.includes('.png.') ? 'image/png' : 'image/jpeg',
    };
  }

  async history(viewer: HUserDocument, id: Types.ObjectId) {
    const analysis = await this.load(viewer, id);
    return (analysis.history ?? []).map((h) => ({ status: h.status, message: Localize.text(h.message), at: h.at }));
  }

  async remove(actor: HUserDocument, id: Types.ObjectId) {
    const analysis = await this.load(actor, id);
    if (actor.role === SystemRoleEnum.PATIENT) {
      throw new BadRequestException('Patients cannot delete analyses');
    }
    if (actor.role === SystemRoleEnum.DOCTOR) await this.access.assertTreatingDoctor(actor, analysis.patient);
    if (await this.reports.typedModel.exists({ analysis: id })) {
      throw new ConflictException('Delete the reports generated from this analysis first');
    }
    await this.storage.remove(analysis.gradCamKey);
    await this.reviews.deleteMany({ filter: { analysis: id } });
    await this.analyses.deleteOne({ filter: { _id: id } });
    return { deleted: true };
  }
}
