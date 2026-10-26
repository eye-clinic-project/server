import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Report, ReportDocument } from '../model/report.model.js';
import { DatabaseRepository } from './base.repository.js';


@Injectable()
export class ReportRepository extends DatabaseRepository<ReportDocument> {
  constructor(@InjectModel(Report.name) model: Model<ReportDocument>) {
    super(model);
  }

  findByAnalysis(analysisId: Types.ObjectId | string) {
    return this.findOne({ filter: { analysis: analysisId } });
  }
}
