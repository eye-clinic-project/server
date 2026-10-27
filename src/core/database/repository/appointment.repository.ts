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

  async findForParticipant(userId: Types.ObjectId) {
    return this.appointmentModel
      .find({ $or: [{ doctor: userId }, { patient: userId }] })
      .populate('doctor')
      .populate('patient')
      .sort({ scheduledAt: 1 })
      .exec();
  }

  async findByIdForParticipant(
    appointmentId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    return this.appointmentModel
      .findOne({
        _id: appointmentId,
        $or: [{ doctor: userId }, { patient: userId }],
      })
      .populate('doctor')
      .populate('patient')
      .exec();
  }

  async findParticipantAppointment(
    appointmentId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    return this.appointmentModel
      .findOne({
        _id: appointmentId,
        $or: [{ doctor: userId }, { patient: userId }],
      })
      .exec();
  }

  async findConflict({
    doctorId,
    patientId,
    scheduledAt,
    excludeAppointmentId,
  }: {
    doctorId: Types.ObjectId;
    patientId: Types.ObjectId;
    scheduledAt: Date;
    excludeAppointmentId?: Types.ObjectId;
  }) {
    return this.appointmentModel
      .findOne({
        $or: [{ doctor: doctorId }, { patient: patientId }],
        scheduledAt,
        status: {
          $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
        ...(excludeAppointmentId && { _id: { $ne: excludeAppointmentId } }),
      })
      .exec();
  }

  async updateScheduleIfActive({
    appointmentId,
    scheduledAt,
    notes,
  }: {
    appointmentId: Types.ObjectId;
    scheduledAt: Date;
    notes?: string;
  }) {
    return this.appointmentModel
      .findOneAndUpdate(
        {
          _id: appointmentId,
          status: {
            $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
          },
        },
        {
          $set: {
            scheduledAt,
            status: AppointmentStatus.PENDING,
            ...(notes !== undefined && { notes }),
          },
          $inc: { __v: 1 },
        },
        { new: true, runValidators: true },
      )
      .populate('doctor')
      .populate('patient')
      .exec();
  }

  async transitionStatus({
    appointmentId,
    userId,
    role,
    from,
    to,
  }: {
    appointmentId: Types.ObjectId;
    userId: Types.ObjectId;
    role: 'doctor' | 'patient';
    from: AppointmentStatus[];
    to: AppointmentStatus;
  }) {
    const participantField = role;
    return this.appointmentModel
      .findOneAndUpdate(
        {
          _id: appointmentId,
          [participantField]: userId,
          status: { $in: from },
        },
        { $set: { status: to }, $inc: { __v: 1 } },
        { new: true, runValidators: true },
      )
      .populate('doctor')
      .populate('patient')
      .exec();
  }

  async findByDoctor(doctorId: Types.ObjectId) {
    return this.appointmentModel
      .find({ doctor: doctorId })
      .populate('patient')
      .sort({ scheduledAt: -1 })
      .exec();
  }

  async findByDoctorAndPatient(
    doctorId: Types.ObjectId,
    patientId: Types.ObjectId,
  ) {
    return this.appointmentModel
      .find({ doctor: doctorId, patient: patientId })
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
          $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
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
          $in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
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

  async updateStatus(appointmentId: Types.ObjectId, status: AppointmentStatus) {
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
