import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';


import { DatabaseRepository } from './base.repository.js';
import { IAppointment } from '../../../common/interface/database-schema.interface.js';
import { Appointment } from '../model/appointment.model.js';
import { AppointmentStatus } from '../../../common/enum/schema.enum.js';

@Injectable()
export class AppointmentRepository extends DatabaseRepository<IAppointment> {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<IAppointment>,
  ) {
    super(appointmentModel);
  }

  async findByDoctor(doctorId: Types.ObjectId) {
    return this.appointmentModel
      .find({ doctor: doctorId })
      .populate('patient')
      .sort({ scheduledAt: -1 })
      .exec();
  }

  async findByPatient(patientId: Types.ObjectId) {
    return this.appointmentModel
      .find({ patient: patientId })
      .populate('doctor')
      .sort({ scheduledAt: -1 })
      .exec();
  }

  async findUpcomingByDoctor(doctorId: Types.ObjectId) {
    return this.appointmentModel
      .find({
        doctor: doctorId,
        scheduledAt: { $gte: new Date() },
        status: {
          $in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
          ],
        },
      })
      .populate('patient')
      .sort({ scheduledAt: 1 })
      .exec();
  }

  async findUpcomingByPatient(patientId: Types.ObjectId) {
    return this.appointmentModel
      .find({
        patient: patientId,
        scheduledAt: { $gte: new Date() },
        status: {
          $in: [
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
          ],
        },
      })
      .populate('doctor')
      .sort({ scheduledAt: 1 })
      .exec();
  }

  async findByStatus(status: AppointmentStatus) {
    return this.appointmentModel
      .find({ status })
      .sort({ scheduledAt: 1 })
      .exec();
  }

  async updateStatus(
    appointmentId: Types.ObjectId,
    status: AppointmentStatus,
  ) {
    return this.appointmentModel
      .findByIdAndUpdate(
        appointmentId,
        { $set: { status } },
        { new: true, runValidators: true },
      )
      .exec();
  }

  async countByDoctorAndStatus(
    doctorId: Types.ObjectId,
    status: AppointmentStatus,
  ) {
    return this.appointmentModel.countDocuments({
      doctor: doctorId,
      status,
    });
  }

  async findBetweenDates(start: Date, end: Date) {
    return this.appointmentModel
      .find({
        scheduledAt: {
          $gte: start,
          $lte: end,
        },
      })
      .sort({ scheduledAt: 1 })
      .exec();
  }
}