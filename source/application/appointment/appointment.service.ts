import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import type { HUserDocument } from '../../database/model/user.model.js';
import { AppointmentRepository } from '../../database/repository/appointment.repository.js';
import { DoctorAvailabilityRepository } from '../../database/repository/doctor-availability.repository.js';
import { UserRepository } from '../../database/repository/user.repository.js';
import { AccessService } from '../../dependency/service/access.service.js';
import { NotifierService } from '../../dependency/service/notifier.service.js';
import { AppointmentStatus, NotificationType } from '../../dependency/enum/database.enum.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { presentUser } from '../../dependency/presenter.js';
import {
  AppointmentQueryDto,
  CancelAppointmentDto,
  CreateAppointmentDto,
  UpdateAppointmentDto,
} from './dto/appointment.dto.js';

const ACTIVE = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];
const fmt = (d: Date) => d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly appointments: AppointmentRepository,
    private readonly slots: DoctorAvailabilityRepository,
    private readonly users: UserRepository,
    private readonly access: AccessService,
    private readonly notifier: NotifierService,
  ) {}

  private present(a: any) {
    return {
      id: a._id.toString(),
      _id: a._id.toString(),
      doctor: a.doctor && typeof a.doctor === 'object' && 'email' in a.doctor ? presentUser(a.doctor) : a.doctor?.toString(),
      patient: a.patient && typeof a.patient === 'object' && 'email' in a.patient ? presentUser(a.patient) : a.patient?.toString(),
      slot: a.slot?.toString() ?? null,
      scheduledAt: a.scheduledAt,
      endAt: a.endAt,
      status: a.status,
      reason: a.reason,
      notes: a.notes,
      cancelReason: a.cancelReason,
      cancelledBy: a.cancelledBy?.toString() ?? null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }

  /** Atomically marks a free future slot as booked; null when it is taken or missing. */
  private async claimSlot(filter: Record<string, unknown>) {
    return this.slots.findOneAndUpdate({
      filter: { ...filter, isBooked: false, startAt: { $gt: new Date() } },
      update: { $set: { isBooked: true } },
    });
  }

  private async releaseSlot(slotId?: Types.ObjectId | null) {
    if (!slotId) return;
    await this.slots.updateOne({ filter: { _id: slotId }, update: { $set: { isBooked: false, appointment: null } } });
  }

  private slotFilter(dto: { slotId?: string; doctorId?: string; scheduledAt?: Date }, doctorId?: Types.ObjectId) {
    if (dto.slotId) {
      return { _id: new Types.ObjectId(dto.slotId), ...(doctorId ? { doctor: doctorId } : {}) };
    }
    if (!dto.scheduledAt) throw new BadRequestException('slotId or scheduledAt is required');
    const doctor = doctorId ?? (dto.doctorId ? new Types.ObjectId(dto.doctorId) : undefined);
    if (!doctor) throw new BadRequestException('doctorId is required');
    return { doctor, startAt: dto.scheduledAt };
  }

  /** FR5.1: book an available slot. Double-booking is prevented by the atomic slot claim. */
  async create(actor: HUserDocument, dto: CreateAppointmentDto) {
    let patientId: Types.ObjectId;
    if (actor.role === SystemRoleEnum.PATIENT) {
      patientId = actor._id;
    } else {
      if (!dto.patientId) throw new BadRequestException('patientId is required');
      patientId = new Types.ObjectId(dto.patientId);
      if (actor.role === SystemRoleEnum.DOCTOR) await this.access.assertTreatingDoctor(actor, patientId);
    }
    const doctorScope = actor.role === SystemRoleEnum.DOCTOR ? actor._id : undefined;
    const slot = await this.claimSlot(this.slotFilter(dto, doctorScope));
    if (!slot) {
      throw new ConflictException('This time slot is no longer available. Please choose another one.');
    }

    let appointment;
    try {
      appointment = await this.appointments.create({
        data: {
          doctor: slot.doctor,
          patient: patientId,
          slot: slot._id,
          scheduledAt: slot.startAt,
          endAt: slot.endAt,
          status: actor.role === SystemRoleEnum.DOCTOR ? AppointmentStatus.CONFIRMED : AppointmentStatus.PENDING,
          reason: dto.reason,
          notes: dto.notes,
        },
      });
      await this.slots.updateOne({ filter: { _id: slot._id }, update: { $set: { appointment: appointment._id } } });
    } catch (error) {
      await this.releaseSlot(slot._id);
      throw error;
    }

    const other = actor.role === SystemRoleEnum.PATIENT ? slot.doctor : patientId;
    await this.notifier.notify({
      recipient: other,
      type: NotificationType.APPOINTMENT,
      title: actor.role === SystemRoleEnum.PATIENT ? 'New appointment request' : 'New appointment booked',
      body: `${actor.role === SystemRoleEnum.DOCTOR ? 'Dr. ' : ''}${actor.name} booked an appointment on ${fmt(slot.startAt)}.`,
      link: `/${actor.role === SystemRoleEnum.PATIENT ? 'doctor' : 'patient'}/appointments`,
      resourceId: appointment._id,
      email: actor.role !== SystemRoleEnum.PATIENT,
    });
    return { ...(await this.findOne(actor, appointment._id)), confirmation: `Appointment booked for ${fmt(slot.startAt)}` };
  }

  async list(viewer: HUserDocument, query: AppointmentQueryDto) {
    const filter: Record<string, any> = {};
    if (viewer.role === SystemRoleEnum.DOCTOR) filter.doctor = viewer._id;
    else if (viewer.role === SystemRoleEnum.PATIENT) filter.patient = viewer._id;
    if (query.doctorId && viewer.role !== SystemRoleEnum.DOCTOR) filter.doctor = new Types.ObjectId(query.doctorId);
    if (query.patientId && viewer.role !== SystemRoleEnum.PATIENT) filter.patient = new Types.ObjectId(query.patientId);
    if (query.status) filter.status = query.status;
    if (query.from || query.to) {
      filter.scheduledAt = {};
      if (query.from) filter.scheduledAt.$gte = query.from;
      if (query.to) filter.scheduledAt.$lte = query.to;
    }
    const page = await this.appointments.paginate({
      filter,
      options: { sort: { scheduledAt: 1 }, populate: [{ path: 'doctor' }, { path: 'patient' }], lean: true },
      page: query.page,
      size: query.size,
    });
    return { items: page.docs.map((a) => this.present(a)), total: page.count, page: page.currentPage, size: page.size, pages: page.pages };
  }

  private async load(actor: HUserDocument, id: Types.ObjectId) {
    const appointment = await this.appointments.findById({ _id: id });
    if (!appointment) throw new NotFoundException('Appointment not found');
    const involved = appointment.doctor.equals(actor._id) || appointment.patient.equals(actor._id);
    if (!involved && actor.role !== SystemRoleEnum.ADMIN) {
      throw new ForbiddenException('You do not have access to this appointment');
    }
    return appointment;
  }

  async findOne(actor: HUserDocument, id: Types.ObjectId) {
    await this.load(actor, id);
    const a = await this.appointments.findById({ _id: id, options: { populate: [{ path: 'doctor' }, { path: 'patient' }], lean: true } });
    return this.present(a);
  }

  private async notifyOther(actor: HUserDocument, appointment: { _id: Types.ObjectId; doctor: Types.ObjectId; patient: Types.ObjectId }, title: string, body: string) {
    const toPatient = !appointment.patient.equals(actor._id);
    await this.notifier.notify({
      recipient: toPatient ? appointment.patient : appointment.doctor,
      type: NotificationType.APPOINTMENT,
      title,
      body,
      link: `/${toPatient ? 'patient' : 'doctor'}/appointments`,
      resourceId: appointment._id,
      email: toPatient,
    });
  }

  /** FR5.2: reschedule to another free slot and/or edit notes. */
  async update(actor: HUserDocument, id: Types.ObjectId, dto: UpdateAppointmentDto) {
    const appointment = await this.load(actor, id);
    if (!ACTIVE.includes(appointment.status)) {
      throw new BadRequestException(`A ${appointment.status} appointment cannot be changed`);
    }
    const set: Record<string, unknown> = {};
    if (dto.reason !== undefined) set.reason = dto.reason;
    if (dto.notes !== undefined) set.notes = dto.notes;

    const rescheduling = !!(dto.slotId || dto.scheduledAt);
    let newSlot = null;
    if (rescheduling) {
      newSlot = await this.claimSlot(this.slotFilter({ ...dto, doctorId: appointment.doctor.toString() }, appointment.doctor));
      if (!newSlot) throw new ConflictException('This time slot is no longer available. Please choose another one.');
      set.slot = newSlot._id;
      set.scheduledAt = newSlot.startAt;
      set.endAt = newSlot.endAt;
      // The other party has to confirm a time proposed by the patient.
      set.status = actor.role === SystemRoleEnum.PATIENT ? AppointmentStatus.PENDING : AppointmentStatus.CONFIRMED;
    }

    const updated = await this.appointments.findOneAndUpdate({
      filter: { _id: id, status: { $in: ACTIVE } },
      update: { $set: set },
    });
    if (!updated) {
      await this.releaseSlot(newSlot?._id);
      throw new ConflictException('The appointment changed, please reload');
    }
    if (newSlot) {
      await this.slots.updateOne({ filter: { _id: newSlot._id }, update: { $set: { appointment: id } } });
      await this.releaseSlot(appointment.slot);
      await this.notifyOther(actor, appointment, 'Appointment rescheduled', `${actor.name} moved the appointment to ${fmt(newSlot.startAt)}.`);
    }
    return this.findOne(actor, id);
  }

  private async transition(
    actor: HUserDocument,
    id: Types.ObjectId,
    from: AppointmentStatus[],
    to: AppointmentStatus,
    extra: Record<string, unknown> = {},
  ) {
    const appointment = await this.load(actor, id);
    const updated = await this.appointments.findOneAndUpdate({
      filter: { _id: id, status: { $in: from } },
      update: { $set: { status: to, ...extra } },
    });
    if (!updated) {
      throw new BadRequestException(`Cannot change a ${appointment.status} appointment to ${to}`);
    }
    return appointment;
  }

  private assertDoctorOf(actor: HUserDocument, doctorId: Types.ObjectId) {
    if (actor.role !== SystemRoleEnum.ADMIN && !doctorId.equals(actor._id)) {
      throw new ForbiddenException('Only the doctor can do this');
    }
  }

  async confirm(actor: HUserDocument, id: Types.ObjectId) {
    this.assertDoctorOf(actor, (await this.load(actor, id)).doctor);
    const a = await this.transition(actor, id, [AppointmentStatus.PENDING], AppointmentStatus.CONFIRMED);
    await this.notifyOther(actor, a, 'Appointment confirmed', `Your appointment on ${fmt(a.scheduledAt)} was confirmed.`);
    return this.findOne(actor, id);
  }

  async cancel(actor: HUserDocument, id: Types.ObjectId, dto: CancelAppointmentDto) {
    const a = await this.transition(actor, id, ACTIVE, AppointmentStatus.CANCELLED, {
      cancelledBy: actor._id,
      cancelReason: dto.reason,
    });
    await this.releaseSlot(a.slot);
    await this.notifyOther(actor, a, 'Appointment cancelled', `The appointment on ${fmt(a.scheduledAt)} was cancelled${dto.reason ? `: ${dto.reason}` : '.'}`);
    return this.findOne(actor, id);
  }

  async complete(actor: HUserDocument, id: Types.ObjectId) {
    this.assertDoctorOf(actor, (await this.load(actor, id)).doctor);
    await this.transition(actor, id, ACTIVE, AppointmentStatus.COMPLETED);
    return this.findOne(actor, id);
  }
}
