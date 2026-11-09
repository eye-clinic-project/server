import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { Types } from 'mongoose';
import type { HUserDocument } from '../../database/model/user.model.js';
import type { HDeviceDocument } from '../../database/model/device.model.js';
import { DeviceRepository } from '../../database/repository/device.repository.js';
import { CaptureSessionRepository } from '../../database/repository/capture-session.repository.js';
import { UserRepository } from '../../database/repository/user.repository.js';
import { AccessService } from '../../dependency/service/access.service.js';
import { NotifierService } from '../../dependency/service/notifier.service.js';
import { RealtimeService } from '../../dependency/service/realtime.service.js';
import { isDuplicateKeyError } from '../../dependency/service/profile.service.js';
import { CaptureSessionStatus, DeviceStatus, ImageSource, NotificationType } from '../../dependency/enum/database.enum.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { presentUser } from '../../dependency/presenter.js';
import { FundusImageService } from '../fundus-image/fundus-image.service.js';
import { hashDeviceKey } from './device.guard.js';
import {
  CaptureSessionQueryDto,
  CreateCaptureSessionDto,
  CreateDeviceDto,
  DeviceUploadDto,
  UpdateCaptureSessionDto,
  UpdateDeviceDto,
} from './dto/hardware.dto.js';

const SESSION_TTL_MS = 30 * 60 * 1000;
const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

const presentDevice = (d: any) => ({
  id: d._id.toString(),
  _id: d._id.toString(),
  name: d.name,
  serialNumber: d.serialNumber,
  model: d.model,
  location: d.location,
  owner: d.owner?.toString(),
  status: d.status,
  apiKeyPrefix: d.apiKeyPrefix,
  lastSeenAt: d.lastSeenAt ?? null,
  online: !!d.lastSeenAt && Date.now() - new Date(d.lastSeenAt).getTime() < 2 * 60 * 1000,
  createdAt: d.createdAt,
});

const presentSession = (s: any) => ({
  id: s._id.toString(),
  _id: s._id.toString(),
  device: s.device?._id ? presentDevice(s.device) : s.device?.toString(),
  doctor: s.doctor?.toString?.(),
  patient: s.patient && typeof s.patient === 'object' && 'email' in s.patient ? presentUser(s.patient) : s.patient?.toString(),
  eye: s.eye,
  status: s.status,
  autoAnalyze: s.autoAnalyze,
  image: s.image?.toString() ?? null,
  analysis: s.analysis?.toString() ?? null,
  error: s.error ?? null,
  expiresAt: s.expiresAt,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

/** FR7.1: fundus camera integration. Captured images go through the same flow as uploads. */
@Injectable()
export class HardwareService {
  constructor(
    private readonly devices: DeviceRepository,
    private readonly sessions: CaptureSessionRepository,
    private readonly users: UserRepository,
    private readonly access: AccessService,
    private readonly notifier: NotifierService,
    private readonly realtime: RealtimeService,
    private readonly fundusImages: FundusImageService,
  ) {}

  private newKey() {
    const bytes = randomBytes(12);
    const prefix = Array.from(bytes, (b) => ALNUM[b % ALNUM.length]).join('');
    const key = `dev_${prefix}_${randomBytes(32).toString('base64url')}`;
    return { key, prefix, hash: hashDeviceKey(key) };
  }

  private async loadDevice(user: HUserDocument, id: Types.ObjectId) {
    const device = await this.devices.findById({ _id: id });
    if (!device) throw new NotFoundException('Device not found');
    if (user.role !== SystemRoleEnum.ADMIN && !device.owner.equals(user._id)) {
      throw new ForbiddenException('This device belongs to another doctor');
    }
    return device;
  }

  async createDevice(user: HUserDocument, dto: CreateDeviceDto) {
    const { key, prefix, hash } = this.newKey();
    try {
      const device = await this.devices.create({
        data: { ...dto, owner: user._id, apiKeyHash: hash, apiKeyPrefix: prefix, status: DeviceStatus.ACTIVE },
      });
      // The key is only shown once; store it on the device firmware.
      return { ...presentDevice(device), apiKey: key };
    } catch (error) {
      if (isDuplicateKeyError(error)) throw new ConflictException('A device with this serial number already exists');
      throw error;
    }
  }

  async listDevices(user: HUserDocument) {
    const filter = user.role === SystemRoleEnum.ADMIN ? {} : { owner: user._id };
    const rows = await this.devices.find({ filter, options: { sort: { createdAt: -1 }, lean: true } });
    return rows.map(presentDevice);
  }

  async getDevice(user: HUserDocument, id: Types.ObjectId) {
    return presentDevice(await this.loadDevice(user, id));
  }

  async updateDevice(user: HUserDocument, id: Types.ObjectId, dto: UpdateDeviceDto) {
    await this.loadDevice(user, id);
    const updated = await this.devices.findOneAndUpdate({ filter: { _id: id }, update: { $set: dto } });
    return presentDevice(updated);
  }

  async rotateKey(user: HUserDocument, id: Types.ObjectId) {
    await this.loadDevice(user, id);
    const { key, prefix, hash } = this.newKey();
    const updated = await this.devices.findOneAndUpdate({ filter: { _id: id }, update: { $set: { apiKeyHash: hash, apiKeyPrefix: prefix } } });
    return { ...presentDevice(updated), apiKey: key };
  }

  async removeDevice(user: HUserDocument, id: Types.ObjectId) {
    await this.loadDevice(user, id);
    await this.sessions.updateMany({
      filter: { device: id, status: { $in: [CaptureSessionStatus.PENDING, CaptureSessionStatus.CAPTURING] } },
      update: { $set: { status: CaptureSessionStatus.CANCELLED } },
    });
    await this.devices.deleteOne({ filter: { _id: id } });
    return { deleted: true };
  }

  async createSession(doctor: HUserDocument, dto: CreateCaptureSessionDto) {
    const device = await this.loadDevice(doctor, new Types.ObjectId(dto.deviceId));
    if (device.status !== DeviceStatus.ACTIVE) throw new BadRequestException('Device is not active');
    const patientId = new Types.ObjectId(dto.patientId);
    await this.access.assertTreatingDoctor(doctor, patientId);
    const session = await this.sessions.create({
      data: {
        device: device._id,
        doctor: doctor._id,
        patient: patientId,
        eye: dto.eye,
        autoAnalyze: dto.autoAnalyze ?? true,
        status: CaptureSessionStatus.PENDING,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });
    return presentSession(session);
  }

  async listSessions(user: HUserDocument, query: CaptureSessionQueryDto) {
    const filter: Record<string, unknown> = user.role === SystemRoleEnum.ADMIN ? {} : { doctor: user._id };
    if (query.status) filter.status = query.status;
    if (query.deviceId) filter.device = new Types.ObjectId(query.deviceId);
    const page = await this.sessions.paginate({
      filter,
      options: { sort: { createdAt: -1 }, populate: [{ path: 'patient' }], lean: true },
      page: query.page,
      size: query.size,
    });
    return { items: page.docs.map(presentSession), total: page.count, page: page.currentPage, size: page.size, pages: page.pages };
  }

  private async loadSession(user: HUserDocument, id: Types.ObjectId) {
    const session = await this.sessions.findById({ _id: id });
    if (!session) throw new NotFoundException('Capture session not found');
    if (user.role !== SystemRoleEnum.ADMIN && !session.doctor.equals(user._id)) {
      throw new ForbiddenException('This capture session belongs to another doctor');
    }
    return session;
  }

  async getSession(user: HUserDocument, id: Types.ObjectId) {
    await this.loadSession(user, id);
    return presentSession(await this.sessions.findById({ _id: id, options: { populate: [{ path: 'patient' }], lean: true } }));
  }

  async updateSession(user: HUserDocument, id: Types.ObjectId, dto: UpdateCaptureSessionDto) {
    await this.loadSession(user, id);
    const updated = await this.sessions.findOneAndUpdate({
      filter: { _id: id, status: { $in: [CaptureSessionStatus.PENDING, CaptureSessionStatus.CAPTURING] } },
      update: { $set: { status: dto.status } },
    });
    if (!updated) throw new BadRequestException('This capture session is already finished');
    return presentSession(updated);
  }

  // ---- Device-side ----

  async heartbeat(device: HDeviceDocument) {
    return { deviceId: device._id.toString(), status: device.status, serverTime: new Date() };
  }

  async pendingSessions(device: HDeviceDocument) {
    const rows = await this.sessions.find({
      filter: {
        device: device._id,
        status: { $in: [CaptureSessionStatus.PENDING, CaptureSessionStatus.CAPTURING] },
        expiresAt: { $gt: new Date() },
      },
      options: { sort: { createdAt: 1 }, lean: true },
    });
    return rows.map((s) => ({ id: s._id.toString(), eye: s.eye, status: s.status, expiresAt: s.expiresAt }));
  }

  private async deviceSession(device: HDeviceDocument, id: Types.ObjectId) {
    const session = await this.sessions.findOne({ filter: { _id: id, device: device._id } });
    if (!session) throw new NotFoundException('Capture session not found');
    if (![CaptureSessionStatus.PENDING, CaptureSessionStatus.CAPTURING].includes(session.status)) {
      throw new ConflictException(`Capture session is ${session.status}`);
    }
    if (session.expiresAt < new Date()) {
      await this.sessions.updateOne({ filter: { _id: id }, update: { $set: { status: CaptureSessionStatus.FAILED, error: 'Session expired' } } });
      throw new ConflictException('Capture session expired');
    }
    return session;
  }

  async deviceUpload(device: HDeviceDocument, id: Types.ObjectId, file: Express.Multer.File, dto: DeviceUploadDto) {
    const session = await this.deviceSession(device, id);
    const doctor = await this.users.findById({ _id: session.doctor });
    if (!doctor) throw new NotFoundException('Doctor not found');
    try {
      const result = await this.fundusImages.ingest({
        doctor,
        patientId: session.patient,
        file,
        eye: dto.eye ?? session.eye,
        source: ImageSource.DEVICE,
        deviceId: device._id,
        captureSessionId: session._id,
        analyze: session.autoAnalyze,
      });
      await this.sessions.updateOne({
        filter: { _id: id },
        update: {
          $set: {
            status: CaptureSessionStatus.UPLOADED,
            image: new Types.ObjectId(result.image!.id!),
            analysis: result.analysis ? new Types.ObjectId(result.analysis.id) : null,
            error: null,
          },
        },
      });
      this.realtime.emitToUser(doctor._id.toString(), 'capture_session_updated', { sessionId: id.toString(), status: CaptureSessionStatus.UPLOADED, ...result });
      return { sessionId: id.toString(), imageId: result.image!.id, analysisId: result.analysis?.id ?? null, analysisStatus: result.analysis?.status ?? null };
    } catch (error) {
      await this.markFailed(device, id, `Upload failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /** Called by the device when capture or transmission fails; the doctor sees the error. */
  async markFailed(device: HDeviceDocument, id: Types.ObjectId, message: string) {
    const session = await this.sessions.findOneAndUpdate({
      filter: { _id: id, device: device._id },
      update: { $set: { status: CaptureSessionStatus.FAILED, error: message } },
    });
    if (!session) throw new NotFoundException('Capture session not found');
    this.realtime.emitToUser(session.doctor.toString(), 'capture_session_updated', { sessionId: id.toString(), status: CaptureSessionStatus.FAILED, error: message });
    await this.notifier.notify({
      recipient: session.doctor,
      type: NotificationType.SYSTEM,
      title: 'Fundus capture failed',
      body: `${device.name}: ${message}`,
      link: '/doctor/devices',
      resourceId: session._id,
    });
    return presentSession(session);
  }
}
