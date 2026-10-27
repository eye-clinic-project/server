import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { Analysis, HAnalysisDocument } from '../model/analysis.model.js';

@Injectable()
export class AnalysisRepository extends DatabaseRepository<HAnalysisDocument> {
  constructor(@InjectModel(Analysis.name) model: Model<HAnalysisDocument>) {
    super(model);
  }

  history(patientId: Types.ObjectId | string, page = 1, size = 10) {
    return this.paginate({
      filter: { patient: patientId },
      options: {
        sort: { createdAt: -1 },
        populate: [{ path: 'doctor', select: 'fullName' }],
      },
      page,
      size,
    });
  }
}
