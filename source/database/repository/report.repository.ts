import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IReport } from '../../dependencies/interface/database.interface.js';
import { Report } from '../model/report.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class ReportRepository extends DatabaseRepository<IReport> {
  constructor(@InjectModel(Report.name) private readonly reportModel: Model<IReport>) {
    super(reportModel);
  }
}
