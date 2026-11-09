import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DatabaseRepository } from './base.repository.js';
import { Appointment } from '../model/appointment.model.js';
import { IAppointment } from '../../dependency/interface/database-schema.interface.js';

@Injectable()
export class AppointmentRepository extends DatabaseRepository<IAppointment> {
  constructor(
    @InjectModel(Appointment.name)
    readonly typedModel: Model<IAppointment>,
  ) {
    super(typedModel);
  }
}
