import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { Report } from '../model/report.model.js';
import { IReport } from '../../dependency/interface/database-schema.interface.js';

@Injectable()
export class ReportRepository extends DatabaseRepository<IReport> {
  constructor(
    @InjectModel(Report.name)
    readonly typedModel: Model<IReport>,
  ) {
    super(typedModel);
  }
}
