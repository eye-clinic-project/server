import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { IReport } from '../../../common/interface/database-schema.interface.js';
import { Report } from '../model/report.model.js';

@Injectable()
export class ReportRepository extends DatabaseRepository<IReport> {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<IReport>,
  ) {
    super(reportModel);
  }

  async findByPatient(patientId: Types.ObjectId) {
    return this.reportModel
      .find({ patient: patientId })
      .populate('doctor')
      .populate('analysis')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByDoctor(doctorId: Types.ObjectId) {
    return this.reportModel
      .find({ doctor: doctorId })
      .populate('patient')
      .populate('analysis')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByDoctorAndPatient(
    doctorId: Types.ObjectId,
    patientId: Types.ObjectId,
  ) {
    return this.reportModel
      .find({ doctor: doctorId, patient: patientId })
      .populate('analysis')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByDoctorAndId(doctorId: Types.ObjectId, reportId: Types.ObjectId) {
    return this.reportModel
      .findOne({ _id: reportId, doctor: doctorId })
      .populate('patient')
      .populate('analysis')
      .exec();
  }

  async findByAnalysis(analysisId: Types.ObjectId) {
    return this.reportModel
      .find({ analysis: analysisId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByPatientAndId(
    patientId: Types.ObjectId,
    reportId: Types.ObjectId,
  ) {
    return this.reportModel
      .findOne({
        _id: reportId,
        patient: patientId,
      })
      .populate('doctor')
      .populate('analysis')
      .exec();
  }

  async countByPatient(patientId: Types.ObjectId) {
    return this.reportModel.countDocuments({
      patient: patientId,
    });
  }
}
