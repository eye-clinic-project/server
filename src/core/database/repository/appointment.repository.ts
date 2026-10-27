import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Appointment,
  HAppointmentDocument,
} from '../model/appointment.model.js';
import { DatabaseRepository } from './base.repository.js';

@Injectable()
export class AppointmentRepository extends DatabaseRepository<HAppointmentDocument> {
  constructor(
    @InjectModel(Appointment.name) model: Model<HAppointmentDocument>,
  ) {
    super(model);
  }
}
