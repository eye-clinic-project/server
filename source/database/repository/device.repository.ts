import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { Device } from '../model/device.model.js';
import { IDevice } from '../../dependency/interface/database-schema.interface.js';

@Injectable()
export class DeviceRepository extends DatabaseRepository<IDevice> {
  constructor(
    @InjectModel(Device.name)
    readonly typedModel: Model<IDevice>,
  ) {
    super(typedModel);
  }
}
