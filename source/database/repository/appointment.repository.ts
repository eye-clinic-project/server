import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import type { IAppointment } from '../../dependencies/interface/index.js';
import { Appointment } from '../model/index.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class AppointmentRepository extends DatabaseRepository<IAppointment> {
  constructor(@InjectModel(Appointment.name) private readonly appointmentModel: Model<IAppointment>) {
    super(appointmentModel);
  }
}
