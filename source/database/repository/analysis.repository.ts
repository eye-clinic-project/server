import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { Analysis } from '../model/analysis.model.js';
import { IAnalysis } from '../../dependency/interface/database-schema.interface.js';

@Injectable()
export class AnalysisRepository extends DatabaseRepository<IAnalysis> {
  constructor(
    @InjectModel(Analysis.name)
    readonly typedModel: Model<IAnalysis>,
  ) {
    super(typedModel);
  }
}
