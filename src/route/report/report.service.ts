import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { ReportRepository } from '../../core/database/repository/report.repository.js';
import { DoctorService } from '../doctor/doctor.service.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { UpdateReportDto } from './dto/update-report.dto.js';

function objectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new NotFoundException('Report not found');
  }
  return new Types.ObjectId(id);
}

@Injectable()
export class ReportService {
  constructor(
    private readonly reports: ReportRepository,
    private readonly doctors: DoctorService,
  ) {}

  findAll(doctorId: string) {
    return this.reports.findByDoctor(objectId(doctorId));
  }

  async findOne(doctorId: string, reportId: string) {
    const report = await this.reports.findByDoctorAndId(
      objectId(doctorId),
      objectId(reportId),
    );
    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  async create(doctorId: string, dto: CreateReportDto) {
    const doctorObjectId = objectId(doctorId);
    const patientId = objectId(dto.patientId);
    const analysisId = objectId(dto.analysisId);

    await this.doctors.verifyReportContext(
      doctorObjectId,
      patientId,
      analysisId,
    );

    return this.reports.create({
      data: {
        doctor: doctorObjectId,
        patient: patientId,
        analysis: analysisId,
        title: dto.title.trim(),
        content: dto.content?.trim(),
        fileUrl: dto.fileUrl?.trim(),
      },
    });
  }

  async update(
    doctorId: string,
    reportId: string,
    dto: UpdateReportDto,
  ) {
    if (
      dto.title === undefined &&
      dto.content === undefined &&
      dto.fileUrl === undefined
    ) {
      throw new BadRequestException('At least one report field is required');
    }

    const existing = await this.reports.findOne({
      filter: {
        _id: objectId(reportId),
        doctor: objectId(doctorId),
      },
    });
    if (!existing) {
      throw new NotFoundException('Report not found');
    }

    await this.doctors.verifyReportContext(
      objectId(doctorId),
      existing.patient,
      existing.analysis,
    );

    const updated = await this.reports.findOneAndUpdate({
      filter: {
        _id: objectId(reportId),
        doctor: objectId(doctorId),
      },
      update: {
        $set: {
          ...(dto.title !== undefined && { title: dto.title.trim() }),
          ...(dto.content !== undefined && { content: dto.content.trim() }),
          ...(dto.fileUrl !== undefined && { fileUrl: dto.fileUrl.trim() }),
        },
      },
      populate: [{ path: 'patient' }, { path: 'analysis' }],
    });

    if (!updated) {
      throw new NotFoundException('Report not found');
    }
    return updated;
  }

  async remove(doctorId: string, reportId: string) {
    const deleted = await this.reports.findOneAndDelete({
      filter: {
        _id: objectId(reportId),
        doctor: objectId(doctorId),
      },
    });
    if (!deleted) {
      throw new NotFoundException('Report not found');
    }
    return { deleted: true };
  }
}
