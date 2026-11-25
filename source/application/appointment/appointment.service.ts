import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';

import { AppointmentRequestStatus, AppointmentRequestType, AppointmentStatus, RescheduleReason } from '../../dependencies/enum/database.enum.js';
import { SystemRoleEnum } from '../../dependencies/enum/security.enum.js';
import type { IUser } from '../../dependencies/interface/database.interface.js';
import { IsPatientAssignedQuery } from '../patient/custom/query/is-patient-assigned.query.js';
import { ClaimSlotCommand } from './custom/command/claim-slot.command.js';
import { CreateAppointmentCommand } from './custom/command/create-appointment.command.js';
import { CreateSlotsCommand } from './custom/command/create-slots.command.js';
import { DecideRequestCommand } from './custom/command/decide-request.command.js';
import { DeleteAppointmentCommand } from './custom/command/delete-appointment.command.js';
import { DeleteSlotCommand } from './custom/command/delete-slot.command.js';
import { ReleaseSlotCommand } from './custom/command/release-slot.command.js';
import { RequestCancelCommand } from './custom/command/request-cancel.command.js';
import { RequestRescheduleCommand } from './custom/command/request-reschedule.command.js';
import { WithdrawRequestCommand } from './custom/command/withdraw-request.command.js';
import { CountPatientAppointmentsOnDayQuery } from './custom/query/count-patient-appointments-on-day.query.js';
import { FindAppointmentQuery } from './custom/query/find-appointment.query.js';
import { FindSlotQuery } from './custom/query/find-slot.query.js';
import { ListAppointmentsQuery } from './custom/query/list-appointments.query.js';
import { ListDoctorSlotsQuery } from './custom/query/list-doctor-slots.query.js';
import { AvailabilityRangeDto } from './dto/availability-range.dto.js';
import { BookAppointmentDto } from './dto/book-appointment.dto.js';
import { CancelRequestDto } from './dto/cancel-request.dto.js';
import { CreateAvailabilityDto } from './dto/create-availability.dto.js';
import { DaySlotsDto } from './dto/day-slots.dto.js';
import { DecideRequestDto } from './dto/decide-request.dto.js';
import { ListAppointmentsDto } from './dto/list-appointments.dto.js';
import { RescheduleRequestDto } from './dto/reschedule-request.dto.js';
import { AppointmentEntity, toAppointmentEntity } from './entity/appointment.entity.js';
import type { AppointmentPage, AppointmentView } from './type/appointment.type.js';
import { SlotEntity, toSlotEntity } from './entity/slot.entity.js';
import { APPOINTMENT_BOOKED_EVENT, AppointmentBookedEvent } from './event/appointment-booked.event.js';
import { APPOINTMENT_CANCEL_REQUESTED_EVENT, AppointmentCancelRequestedEvent } from './event/appointment-cancel-requested.event.js';
import { APPOINTMENT_REQUEST_DECIDED_EVENT, AppointmentRequestDecidedEvent } from './event/appointment-request-decided.event.js';
import { APPOINTMENT_REQUEST_WITHDRAWN_EVENT, AppointmentRequestWithdrawnEvent } from './event/appointment-request-withdrawn.event.js';
import { APPOINTMENT_RESCHEDULE_REQUESTED_EVENT, AppointmentRescheduleRequestedEvent } from './event/appointment-reschedule-requested.event.js';
import { dayRangeFromString, dayRangeOf } from './appointment.time.js';

const MAX_SLOTS_PER_REQUEST = 100;
const MAX_PATIENT_RESCHEDULES = 3;
const DEFAULT_RANGE_DAYS = 30;
const MAX_RANGE_DAYS = 62;
const DAY_MS = 24 * 60 * 60_000;
const OPEN_STATUSES = [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED];

@Injectable()
export class AppointmentService {
  private readonly timeZone: string;

  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventEmitter: EventEmitter2,
    configService: ConfigService,
  ) {
    this.timeZone = configService.get<string>('app.notifications.timezone') ?? 'Africa/Cairo';
  }

  async createAvailability(doctor: IUser, { startAt, endAt, slotMinutes, breakMinutes = 0 }: CreateAvailabilityDto): Promise<SlotEntity[]> {
    if (startAt.getTime() <= Date.now()) throw new BadRequestException('The appointment time must be in the future');
    if (endAt.getTime() <= startAt.getTime()) throw new BadRequestException('endAt must be after startAt');

    const slotMs = slotMinutes * 60_000;
    const stepMs = slotMs + breakMinutes * 60_000;
    const slots: { startAt: Date; endAt: Date }[] = [];
    for (let cursor = startAt.getTime(); cursor + slotMs <= endAt.getTime(); cursor += stepMs) {
      if (slots.length === MAX_SLOTS_PER_REQUEST) throw new BadRequestException(`At most ${MAX_SLOTS_PER_REQUEST} slots can be created at once`);
      slots.push({ startAt: new Date(cursor), endAt: new Date(cursor + slotMs) });
    }
    if (!slots.length) throw new BadRequestException('The range is shorter than one slot');

    const created = await this.commandBus.execute(new CreateSlotsCommand(idOf(doctor), slots));
    return created.map((slot) => toSlotEntity(slot));
  }

  async listMySlots(doctor: IUser, { from, to }: AvailabilityRangeDto): Promise<SlotEntity[]> {
    const start = from ?? new Date();
    const end = to ?? new Date(start.getTime() + DEFAULT_RANGE_DAYS * DAY_MS);
    if (end.getTime() <= start.getTime()) throw new BadRequestException('endAt must be after startAt');
    const cappedEnd = new Date(Math.min(end.getTime(), start.getTime() + MAX_RANGE_DAYS * DAY_MS));

    const slots = await this.queryBus.execute(new ListDoctorSlotsQuery(idOf(doctor), start, cappedEnd, false));
    return slots.map((slot) => toSlotEntity(slot));
  }

  async deleteSlot(doctor: IUser, slotId: Types.ObjectId): Promise<void> {
    const result = await this.commandBus.execute(new DeleteSlotCommand(idOf(doctor), slotId));
    if (result === 'notFound') throw new NotFoundException('Slot not found');
    if (result === 'notOwner') throw new ForbiddenException('You can only change your own availability');
    if (result === 'booked') throw new ConflictException('This slot is booked. Reschedule or cancel the appointment first.');
  }

  async listFreeSlots(patient: IUser, doctorId: Types.ObjectId, { date }: DaySlotsDto): Promise<SlotEntity[]> {
    await this.assertAssigned(doctorId, idOf(patient));
    const day = dayRangeFromString(date, this.timeZone);
    const from = new Date(Math.max(day.start.getTime(), Date.now()));
    if (from.getTime() >= day.end.getTime()) return [];

    const slots = await this.queryBus.execute(new ListDoctorSlotsQuery(doctorId, from, day.end, true));
    return slots.map((slot) => toSlotEntity(slot));
  }

  async book(patient: IUser, { slotId, reason }: BookAppointmentDto): Promise<AppointmentEntity> {
    const patientId = idOf(patient);
    const slot = await this.queryBus.execute(new FindSlotQuery(new Types.ObjectId(slotId)));
    if (!slot) throw new NotFoundException('Slot not found');
    await this.assertAssigned(slot.doctor, patientId);
    if (slot.isBooked || slot.startAt.getTime() <= Date.now()) throw new ConflictException('This time slot is no longer available. Please choose another one.');

    const day = dayRangeOf(slot.startAt, this.timeZone);
    if (await this.queryBus.execute(new CountPatientAppointmentsOnDayQuery(patientId, day))) {
      throw new ConflictException('You already have an appointment on this day');
    }

    const claimed = await this.commandBus.execute(new ClaimSlotCommand(slot._id, slot.doctor));
    if (!claimed) throw new ConflictException('This slot was just booked');

    const appointmentId = await this.commandBus.execute(new CreateAppointmentCommand(patientId, claimed, reason)).catch(async (error: unknown) => {
      await this.commandBus.execute(new ReleaseSlotCommand(slot._id));
      throw error;
    });

    if ((await this.queryBus.execute(new CountPatientAppointmentsOnDayQuery(patientId, day))) > 1) {
      await this.commandBus.execute(new DeleteAppointmentCommand(appointmentId));
      await this.commandBus.execute(new ReleaseSlotCommand(slot._id, appointmentId));
      throw new ConflictException('You already have an appointment on this day');
    }

    const booked = await this.load(appointmentId);
    this.eventEmitter.emit(APPOINTMENT_BOOKED_EVENT, new AppointmentBookedEvent(booked));
    return toAppointmentEntity(booked);
  }

  async list(user: IUser, { status, pendingRequest, from, to, page = 1, size = 20 }: ListAppointmentsDto): Promise<AppointmentPage> {
    const owner = user.role === SystemRoleEnum.DOCTOR ? { doctorId: idOf(user) } : { patientId: idOf(user) };
    const result = await this.queryBus.execute(new ListAppointmentsQuery({ ...owner, status, pendingRequest, from, to }, page, size));
    return { ...result, docs: result.docs.map((appointment) => toAppointmentEntity(appointment)) };
  }

  async findOne(user: IUser, appointmentId: Types.ObjectId): Promise<AppointmentEntity> {
    const appointment = await this.load(appointmentId);
    if (!isParticipant(user, appointment)) throw new ForbiddenException('You do not have access to this appointment');
    return toAppointmentEntity(appointment);
  }

  async requestCancel(patient: IUser, appointmentId: Types.ObjectId, { reason }: CancelRequestDto): Promise<AppointmentEntity> {
    const appointment = await this.loadOwnChangeable(patient, appointmentId);
    const updated = await this.commandBus.execute(new RequestCancelCommand(appointment._id, idOf(patient), reason));
    if (!updated) throw new ConflictException('The appointment changed, please reload');
    this.eventEmitter.emit(APPOINTMENT_CANCEL_REQUESTED_EVENT, new AppointmentCancelRequestedEvent(appointment, reason));
    return toAppointmentEntity(await this.load(appointmentId));
  }

  async requestReschedule(patient: IUser, appointmentId: Types.ObjectId, { slotId, reason, note }: RescheduleRequestDto): Promise<AppointmentEntity> {
    const patientId = idOf(patient);
    const appointment = await this.loadOwnChangeable(patient, appointmentId);
    if (reason === RescheduleReason.DOCTOR_UNAVAILABLE) throw new BadRequestException('You cannot reschedule for this reason');

    const patientReschedules = (appointment.rescheduleHistory ?? []).filter((entry) => entry.byRole === SystemRoleEnum.PATIENT).length;
    if (patientReschedules >= MAX_PATIENT_RESCHEDULES)
      throw new BadRequestException(`You can reschedule this appointment at most ${MAX_PATIENT_RESCHEDULES} times`);

    const slot = await this.queryBus.execute(new FindSlotQuery(new Types.ObjectId(slotId)));
    if (!slot || !slot.doctor.equals(appointment.doctor._id)) throw new NotFoundException('Slot not found');
    if (appointment.slot?.equals(slot._id) || slot.startAt.getTime() === appointment.scheduledAt.getTime()) {
      throw new BadRequestException('The new time is the same as the current one');
    }
    if (slot.isBooked || slot.startAt.getTime() <= Date.now()) throw new ConflictException('This time slot is no longer available. Please choose another one.');

    const day = dayRangeOf(slot.startAt, this.timeZone);
    if (await this.queryBus.execute(new CountPatientAppointmentsOnDayQuery(patientId, day, appointment._id))) {
      throw new ConflictException('You already have an appointment on this day');
    }

    const claimed = await this.commandBus.execute(new ClaimSlotCommand(slot._id, slot.doctor));
    if (!claimed) throw new ConflictException('This slot was just booked');

    const requested = await this.commandBus
      .execute(new RequestRescheduleCommand(appointment._id, patientId, claimed, reason, note))
      .catch(async (error: unknown) => {
        await this.commandBus.execute(new ReleaseSlotCommand(slot._id));
        throw error;
      });
    if (!requested) {
      await this.commandBus.execute(new ReleaseSlotCommand(slot._id));
      throw new ConflictException('The appointment changed, please reload');
    }
    this.eventEmitter.emit(APPOINTMENT_RESCHEDULE_REQUESTED_EVENT, new AppointmentRescheduleRequestedEvent(appointment, claimed.startAt, reason, note));
    return toAppointmentEntity(await this.load(appointmentId));
  }

  async withdrawRequest(patient: IUser, appointmentId: Types.ObjectId): Promise<AppointmentEntity> {
    const appointment = await this.load(appointmentId);
    if (!appointment.patient?._id.equals(idOf(patient))) throw new ForbiddenException('Only the patient can do this');

    const previous = await this.commandBus.execute(new WithdrawRequestCommand(appointment._id, idOf(patient)));
    if (!previous?.changeRequest) throw new BadRequestException('This appointment has no pending request');
    if (previous.changeRequest.type === AppointmentRequestType.RESCHEDULE && previous.changeRequest.slot) {
      await this.commandBus.execute(new ReleaseSlotCommand(previous.changeRequest.slot, appointment._id));
    }
    this.eventEmitter.emit(APPOINTMENT_REQUEST_WITHDRAWN_EVENT, new AppointmentRequestWithdrawnEvent(appointment));
    return toAppointmentEntity(await this.load(appointmentId));
  }

  async decideRequest(doctor: IUser, appointmentId: Types.ObjectId, approve: boolean, { note }: DecideRequestDto): Promise<AppointmentEntity> {
    const appointment = await this.load(appointmentId);
    if (!appointment.doctor?._id.equals(idOf(doctor))) throw new ForbiddenException('Only the doctor can do this');

    const request = appointment.changeRequest;
    if (!request || request.status !== AppointmentRequestStatus.PENDING) throw new BadRequestException('This appointment has no pending request');
    if (approve && request.type === AppointmentRequestType.RESCHEDULE && (!request.scheduledAt || request.scheduledAt.getTime() <= Date.now())) {
      throw new BadRequestException('The appointment time must be in the future');
    }

    const decided = await this.commandBus.execute(new DecideRequestCommand(appointment, idOf(doctor), approve, note));
    if (!decided) throw new ConflictException('The appointment changed, please reload');

    const slotToRelease = approve ? appointment.slot : request.type === AppointmentRequestType.RESCHEDULE ? request.slot : null;
    if (slotToRelease) await this.commandBus.execute(new ReleaseSlotCommand(slotToRelease, appointment._id));

    this.eventEmitter.emit(APPOINTMENT_REQUEST_DECIDED_EVENT, new AppointmentRequestDecidedEvent(appointment, approve, note));
    return toAppointmentEntity(await this.load(appointmentId));
  }

  private async load(appointmentId: Types.ObjectId): Promise<AppointmentView> {
    const appointment = await this.queryBus.execute(new FindAppointmentQuery(appointmentId));
    if (!appointment) throw new NotFoundException('Appointment not found');
    return appointment;
  }

  private async loadOwnChangeable(patient: IUser, appointmentId: Types.ObjectId): Promise<AppointmentView> {
    const appointment = await this.load(appointmentId);
    if (!appointment.patient?._id.equals(idOf(patient))) throw new ForbiddenException('Only the patient can do this');
    if (!OPEN_STATUSES.includes(appointment.status)) throw new BadRequestException(`A ${appointment.status} appointment cannot be changed`);
    if (appointment.scheduledAt.getTime() <= Date.now()) throw new BadRequestException('The appointment time must be in the future');
    if (appointment.changeRequest?.status === AppointmentRequestStatus.PENDING) throw new ConflictException('This appointment already has a pending request');
    return appointment;
  }

  private async assertAssigned(doctorId: Types.ObjectId, patientId: Types.ObjectId): Promise<void> {
    const assigned = await this.queryBus.execute(new IsPatientAssignedQuery(doctorId, patientId));
    if (!assigned) throw new ForbiddenException('You can only book appointments with your assigned doctor');
  }
}

const idOf = (user: IUser): Types.ObjectId => new Types.ObjectId(user._id);

const isParticipant = (user: IUser, appointment: AppointmentView): boolean =>
  !!appointment.doctor?._id.equals(idOf(user)) || !!appointment.patient?._id.equals(idOf(user));
