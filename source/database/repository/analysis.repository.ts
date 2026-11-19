import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IAnalysis } from '../../dependencies/interface/index.js';
import { Analysis } from '../model/index.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class AnalysisRepository extends DatabaseRepository<IAnalysis> {
  constructor(@InjectModel(Analysis.name) private readonly analysisModel: Model<IAnalysis>) {
    super(analysisModel);
  }
}
