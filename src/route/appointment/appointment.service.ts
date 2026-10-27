import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import { AppointmentStatus } from '../../common/enum/schema.enum.js';
import { AppointmentRepository } from '../../core/database/repository/appointment.repository.js';
import { DoctorService } from '../doctor/doctor.service.js';
import { PatientService } from '../patient/patient.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { UpdateAppointmentDto } from './dto/update-appointment.dto.js';

function objectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new NotFoundException('Appointment not found');
  }
  return new Types.ObjectId(id);
}

@Injectable()
export class AppointmentService {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly doctors: DoctorService,
    private readonly patients: PatientService,
  ) {}

  async create(patientId: string, dto: CreateAppointmentDto) {
    const patientObjectId = objectId(patientId);
    const doctorObjectId = objectId(dto.doctorId);
    this.assertFutureDate(dto.scheduledAt);

    await Promise.all([
      this.doctors.findProfile(doctorObjectId.toString()),
      this.patients.findProfile(patientObjectId),
      this.doctors.assertAssignedPatient(doctorObjectId, patientObjectId),
    ]);

    if (
      await this.appointments.findConflict({
        doctorId: doctorObjectId,
        patientId: patientObjectId,
        scheduledAt: dto.scheduledAt,
      })
    ) {
      throw new ConflictException(
        'The doctor or patient already has an appointment at this time',
      );
    }

    return this.appointments.create({
      data: {
        doctor: doctorObjectId,
        patient: patientObjectId,
        scheduledAt: dto.scheduledAt,
        status: AppointmentStatus.PENDING,
        notes: dto.notes?.trim(),
      },
    });
  }

  findAll(userId: string) {
    return this.appointments.findForParticipant(objectId(userId));
  }

  async findUpcoming(userId: string, role: UserRoleEnum) {
    const id = objectId(userId);
    if (role === UserRoleEnum.DOCTOR) {
      return this.appointments.findUpcomingByDoctor(id);
    }
    if (role === UserRoleEnum.PATIENT) {
      return this.appointments.findUpcomingByPatient(id);
    }
    throw new ForbiddenException(
      'An appointment participant account is required',
    );
  }

  async findOne(userId: string, appointmentId: string) {
    const appointment = await this.appointments.findByIdForParticipant(
      objectId(appointmentId),
      objectId(userId),
    );
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  async reschedule(
    userId: string,
    appointmentId: string,
    dto: UpdateAppointmentDto,
  ) {
    const appointmentObjectId = objectId(appointmentId);
    const appointment = await this.appointments.findParticipantAppointment(
      appointmentObjectId,
      objectId(userId),
    );
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    this.assertFutureDate(dto.scheduledAt);
    await this.doctors.assertAssignedPatient(
      appointment.doctor,
      appointment.patient,
    );

    if (
      await this.appointments.findConflict({
        doctorId: appointment.doctor,
        patientId: appointment.patient,
        scheduledAt: dto.scheduledAt,
        excludeAppointmentId: appointmentObjectId,
      })
    ) {
      throw new ConflictException(
        'The doctor or patient already has an appointment at this time',
      );
    }

    const updated = await this.appointments.updateScheduleIfActive({
      appointmentId: appointmentObjectId,
      scheduledAt: dto.scheduledAt,
      notes: dto.notes?.trim(),
    });
    if (!updated) {
      throw new ConflictException(
        'Only active appointments can be rescheduled',
      );
    }
    return updated;
  }

  async confirm(doctorId: string, appointmentId: string) {
    const id = objectId(doctorId);
    const existing = await this.appointments.findParticipantAppointment(
      objectId(appointmentId),
      id,
    );
    if (!existing) {
      throw new NotFoundException('Appointment not found');
    }
    await this.doctors.assertAssignedPatient(existing.doctor, existing.patient);
    const appointment = await this.appointments.transitionStatus({
      appointmentId: objectId(appointmentId),
      userId: id,
      role: 'doctor',
      from: [AppointmentStatus.PENDING],
      to: AppointmentStatus.CONFIRMED,
    });
    if (!appointment) {
      throw new ConflictException('Only pending appointments can be confirmed');
    }
    return appointment;
  }

  async cancel(userId: string, role: UserRoleEnum, appointmentId: string) {
    if (role !== UserRoleEnum.DOCTOR && role !== UserRoleEnum.PATIENT) {
      throw new ForbiddenException(
        'An appointment participant account is required',
      );
    }

    const id = objectId(userId);
    await this.findOne(userId, appointmentId);
    const appointment = await this.appointments.transitionStatus({
      appointmentId: objectId(appointmentId),
      userId: id,
      role,
      from: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
      to: AppointmentStatus.CANCELLED,
    });
    if (!appointment) {
      throw new ConflictException('Only active appointments can be cancelled');
    }
    return appointment;
  }

  remove(userId: string, role: UserRoleEnum, appointmentId: string) {
    return this.cancel(userId, role, appointmentId);
  }

  private assertFutureDate(scheduledAt: Date) {
    if (
      !(scheduledAt instanceof Date) ||
      Number.isNaN(scheduledAt.getTime()) ||
      scheduledAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Appointment time must be in the future');
    }
  }
}
