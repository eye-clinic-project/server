import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { DatabaseRepository } from './base.repository.js';
import { IFundusImage } from '../../../common/interface/database-schema.interface.js';
import { FundusImage } from '../model/fundus-image.model.js';

@Injectable()
export class FundusImageRepository extends DatabaseRepository<IFundusImage> {
  constructor(
    @InjectModel(FundusImage.name)
    private readonly fundusImageModel: Model<FundusImage>,
  ) {
    super(fundusImageModel);
  }

  async findByPatient(patientId: Types.ObjectId) {
    return this.fundusImageModel
      .find({ patient: patientId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByUploader(uploaderId: Types.ObjectId) {
    return this.fundusImageModel
      .find({ uploadedBy: uploaderId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByPatientAndId(patientId: Types.ObjectId, imageId: Types.ObjectId) {
    return this.fundusImageModel
      .findOne({
        _id: imageId,
        patient: patientId,
      })
      .exec();
  }

  async countByPatient(patientId: Types.ObjectId) {
    return this.fundusImageModel.countDocuments({
      patient: patientId,
    });
  }

  async findLatestByPatient(patientId: Types.ObjectId) {
    return this.fundusImageModel
      .findOne({ patient: patientId })
      .sort({ createdAt: -1 })
      .exec();
  }
}
