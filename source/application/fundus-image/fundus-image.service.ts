import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { HUserDocument } from '../../database/model/user.model.js';
import { FundusImageRepository } from '../../database/repository/fundus-image.repository.js';
import { AnalysisRepository } from '../../database/repository/analysis.repository.js';
import { UserRepository } from '../../database/repository/user.repository.js';
import { AccessService } from '../../dependency/service/access.service.js';
import { StorageService, extensionForMime } from '../../dependency/service/storage.service.js';
import { EyeSide, ImageSource } from '../../dependency/enum/database.enum.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { presentImage } from '../../dependency/presenter.js';
import { AnalysisService } from '../analysis/analysis.service.js';
import { FundusImageQueryDto, UpdateFundusImageDto, UploadFundusImageDto } from './dto/fundus-image.dto.js';

export interface IngestImageInput {
  doctor: HUserDocument;
  patientId: Types.ObjectId;
  file: Express.Multer.File;
  eye?: EyeSide;
  notes?: string;
  capturedAt?: Date;
  source: ImageSource;
  analyze: boolean;
}

@Injectable()
export class FundusImageService {
  constructor(
    private readonly images: FundusImageRepository,
    private readonly analysesRepo: AnalysisRepository,
    private readonly users: UserRepository,
    private readonly access: AccessService,
    private readonly storage: StorageService,
    private readonly analyses: AnalysisService,
  ) {}

  /**
   * Stores an image (encrypted, unmodified) and optionally runs the AI analysis.
   * Used by manual uploads (FR3.1).
   */
  async ingest(input: IngestImageInput) {
    await this.access.assertTreatingDoctor(input.doctor, input.patientId);
    const storageKey = await this.storage.save('fundus', input.file.buffer, extensionForMime(input.file.mimetype));
    const image = await this.images.create({
      data: {
        patient: input.patientId,
        uploadedBy: input.doctor._id,
        eye: input.eye ?? EyeSide.UNKNOWN,
        source: input.source,
        storageKey,
        mimeType: input.file.mimetype,
        size: input.file.size,
        sha256: StorageService.sha256(input.file.buffer),
        originalName: input.file.originalname?.slice(0, 200),
        notes: input.notes,
        capturedAt: input.capturedAt ?? new Date(),
      },
    });

    let analysis = null;
    if (input.analyze) {
      const created = await this.analyses.create(input.doctor, image._id);
      analysis = await this.analyses.run(input.doctor, new Types.ObjectId(created!.id));
    }
    return { image: presentImage(image.toObject()), analysis };
  }

  async upload(doctor: HUserDocument, file: Express.Multer.File, dto: UploadFundusImageDto) {
    const patientId = new Types.ObjectId(dto.patientId);
    const patient = await this.users.findById({ _id: patientId });
    if (!patient || patient.role !== SystemRoleEnum.PATIENT) throw new NotFoundException('Patient not found');
    return this.ingest({
      doctor,
      patientId,
      file,
      eye: dto.eye,
      notes: dto.notes,
      capturedAt: dto.capturedAt,
      source: ImageSource.UPLOAD,
      analyze: dto.analyze !== false,
    });
  }

  async list(viewer: HUserDocument, query: FundusImageQueryDto) {
    const filter: Record<string, any> = await this.access.patientFilter(viewer);
    if (query.patientId) {
      const patientId = new Types.ObjectId(query.patientId);
      await this.access.assertCanAccessPatient(viewer, patientId);
      filter.patient = patientId;
    }
    if (query.eye) filter.eye = query.eye;
    const page = await this.images.paginate({
      filter,
      options: { sort: { createdAt: -1 }, populate: [{ path: 'patient' }, { path: 'uploadedBy' }], lean: true },
      page: query.page,
      size: query.size,
    });
    return {
      items: page.docs.map((doc) => presentImage(doc)),
      total: page.count,
      page: page.currentPage,
      size: page.size,
      pages: page.pages,
    };
  }

  private async load(viewer: HUserDocument, id: Types.ObjectId) {
    const image = await this.images.findById({ _id: id, projection: '+storageKey' });
    return this.access.assertDocumentAccess(viewer, image, 'Image');
  }

  async findOne(viewer: HUserDocument, id: Types.ObjectId) {
    await this.load(viewer, id);
    const image = await this.images.findById({
      _id: id,
      options: { populate: [{ path: 'patient' }, { path: 'uploadedBy' }], lean: true },
    });
    const analyses = await this.analysesRepo.find({
      filter: { image: id },
      projection: { status: 1, predictedLevel: 1, hasDR: 1, createdAt: 1 },
      options: { sort: { createdAt: -1 }, lean: true },
    });
    return {
      ...presentImage(image),
      analyses: analyses.map((a: any) => ({
        id: a._id.toString(),
        status: a.status,
        predictedLevel: a.predictedLevel,
        hasDR: a.hasDR,
        createdAt: a.createdAt,
      })),
    };
  }

  async file(viewer: HUserDocument | null, id: Types.ObjectId) {
    const image = viewer ? await this.load(viewer, id) : await this.images.findById({ _id: id, projection: '+storageKey' });
    if (!image) throw new NotFoundException('Image not found');
    return {
      data: await this.storage.read(image.storageKey),
      mimeType: image.mimeType,
      filename: `fundus-${image._id.toString()}.${extensionForMime(image.mimeType)}`,
    };
  }

  async update(viewer: HUserDocument, id: Types.ObjectId, dto: UpdateFundusImageDto) {
    const image = await this.load(viewer, id);
    await this.access.assertTreatingDoctor(viewer, image.patient);
    await this.images.updateOne({ filter: { _id: id }, update: { $set: dto } });
    return this.findOne(viewer, id);
  }

  async remove(viewer: HUserDocument, id: Types.ObjectId) {
    const image = await this.load(viewer, id);
    if (viewer.role !== SystemRoleEnum.ADMIN) {
      await this.access.assertTreatingDoctor(viewer, image.patient);
    }
    if (await this.analysesRepo.typedModel.exists({ image: id })) {
      throw new ConflictException('Delete the analyses of this image first');
    }
    await this.storage.remove(image.storageKey);
    await this.images.deleteOne({ filter: { _id: id } });
    return { deleted: true };
  }
}
