import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { CaptureSession } from '../model/capture-session.model.js';
import { ICaptureSession } from '../../dependency/interface/database-schema.interface.js';

@Injectable()
export class CaptureSessionRepository extends DatabaseRepository<ICaptureSession> {
  constructor(
    @InjectModel(CaptureSession.name)
    readonly typedModel: Model<ICaptureSession>,
  ) {
    super(typedModel);
  }
}
