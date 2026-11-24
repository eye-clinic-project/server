import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import type { Queue } from 'bullmq';
import { OnEvent } from '@nestjs/event-emitter';
import type { AppointmentView } from '../entity/appointment.type.js';
import { APPOINTMENT_QUEUE, AppointmentJob, type NotifyAppointmentJob, toQueuedArgs } from '../queue/appointment.queue.js';
import type { NotificationArg } from '../../../dependencies/service/notification.service.js';
import { APPOINTMENT_BOOKED_EVENT, AppointmentBookedEvent } from './appointment-booked.event.js';
import { APPOINTMENT_CANCEL_REQUESTED_EVENT, AppointmentCancelRequestedEvent } from './appointment-cancel-requested.event.js';
import { APPOINTMENT_REQUEST_DECIDED_EVENT, AppointmentRequestDecidedEvent } from './appointment-request-decided.event.js';
import { APPOINTMENT_REQUEST_WITHDRAWN_EVENT, AppointmentRequestWithdrawnEvent } from './appointment-request-withdrawn.event.js';
import { APPOINTMENT_RESCHEDULE_REQUESTED_EVENT, AppointmentRescheduleRequestedEvent } from './appointment-reschedule-requested.event.js';
import { AppointmentRequestType } from '../../../dependencies/enum/database.enum.js';
import { LoggerService } from '../../../dependencies/service/logger.service.js';

type Recipient = 'doctor' | 'patient';

@Injectable()
export class AppointmentListener {
  constructor(
    private readonly loggerService: LoggerService,
    @InjectQueue(APPOINTMENT_QUEUE) private readonly appointmentQueue: Queue<NotifyAppointmentJob>,
  ) {}

  @OnEvent(APPOINTMENT_BOOKED_EVENT)
  handleBooked({ appointment }: AppointmentBookedEvent): Promise<void> {
    return this.enqueue(appointment, 'doctor', 'appointmentBookedByPatient', { patient: appointment.patient.name, date: appointment.scheduledAt });
  }

  @OnEvent(APPOINTMENT_CANCEL_REQUESTED_EVENT)
  handleCancelRequested({ appointment, reason }: AppointmentCancelRequestedEvent): Promise<void> {
    return this.enqueue(appointment, 'doctor', 'cancelRequested', { patient: appointment.patient.name, date: appointment.scheduledAt, reason });
  }

  @OnEvent(APPOINTMENT_RESCHEDULE_REQUESTED_EVENT)
  handleRescheduleRequested({ appointment, newDate, reason, note }: AppointmentRescheduleRequestedEvent): Promise<void> {
    return this.enqueue(appointment, 'doctor', 'rescheduleRequested', {
      patient: appointment.patient.name,
      date: appointment.scheduledAt,
      newDate,
      reason: note ?? { key: `rescheduleReasons.${reason}` },
    });
  }

  @OnEvent(APPOINTMENT_REQUEST_WITHDRAWN_EVENT)
  handleRequestWithdrawn({ appointment }: AppointmentRequestWithdrawnEvent): Promise<void> {
    return this.enqueue(appointment, 'doctor', 'requestWithdrawn', { patient: appointment.patient.name, date: appointment.scheduledAt });
  }

  @OnEvent(APPOINTMENT_REQUEST_DECIDED_EVENT)
  handleRequestDecided({ appointment, approved, note }: AppointmentRequestDecidedEvent): Promise<void> {
    const request = appointment.changeRequest;
    if (!request) return Promise.resolve();
    const isCancel = request.type === AppointmentRequestType.CANCEL;
    const doctorName = { key: 'doctorName', args: { name: appointment.doctor.name } };

    if (!approved) {
      return this.enqueue(appointment, 'patient', isCancel ? 'cancelRejected' : 'rescheduleRejected', {
        doctor: appointment.doctor.name,
        date: appointment.scheduledAt,
        note: note ?? '',
      });
    }
    if (isCancel)
      return this.enqueue(appointment, 'patient', 'appointmentCancelled', { by: doctorName, date: appointment.scheduledAt, reason: request.reason });
    return this.enqueue(appointment, 'patient', 'appointmentRescheduled', {
      by: doctorName,
      date: request.scheduledAt!,
      reason: request.rescheduleReason ? { key: `rescheduleReasons.${request.rescheduleReason}` } : request.reason,
    });
  }

  private async enqueue(appointment: AppointmentView, to: Recipient, template: string, args: Record<string, NotificationArg>): Promise<void> {
    const recipient = appointment[to]?._id;
    if (!recipient) return;
    try {
      await this.appointmentQueue.add(AppointmentJob.NOTIFY, {
        appointmentId: appointment._id.toString(),
        recipientId: recipient.toString(),
        template,
        args: toQueuedArgs(args),
      });
    } catch (error: unknown) {
      this.loggerService.warn(error);
    }
  }
}
