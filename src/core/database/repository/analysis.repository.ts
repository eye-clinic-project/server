import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { DatabaseRepository } from './base.repository.js';
import { IAnalysis } from '../../../common/interface/database-schema.interface.js';
import { Analysis } from '../model/analysis.model.js';

@Injectable()
export class AnalysisRepository extends DatabaseRepository<IAnalysis> {
  constructor(
    @InjectModel(Analysis.name)
    private readonly analysisModel: Model<IAnalysis>,
  ) {
    super(analysisModel);
  }

  async findByPatient(patientId: Types.ObjectId) {
    return this.analysisModel
      .find({ patient: patientId })
      .populate('doctor')
      .populate('image')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByDoctor(doctorId: Types.ObjectId) {
    return this.analysisModel
      .find({ doctor: doctorId })
      .populate('patient')
      .populate('image')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByImage(imageId: Types.ObjectId) {
    return this.analysisModel
      .find({ image: imageId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findLatestByPatient(patientId: Types.ObjectId) {
    return this.analysisModel
      .findOne({ patient: patientId })
      .sort({ createdAt: -1 })
      .populate('doctor')
      .populate('image')
      .exec();
  }

  async findLatestByImage(imageId: Types.ObjectId) {
    return this.analysisModel
      .findOne({ image: imageId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByPatientAndId(
    patientId: Types.ObjectId,
    analysisId: Types.ObjectId,
  ) {
    return this.analysisModel
      .findOne({
        _id: analysisId,
        patient: patientId,
      })
      .populate('doctor')
      .populate('image')
      .exec();
  }

  async countByPatient(patientId: Types.ObjectId) {
    return this.analysisModel.countDocuments({
      patient: patientId,
    });
  }

  async countByPredictedLevel(
    patientId: Types.ObjectId,
    predictedLevel: number,
  ) {
    return this.analysisModel.countDocuments({
      patient: patientId,
      predictedLevel,
    });
  }
}
