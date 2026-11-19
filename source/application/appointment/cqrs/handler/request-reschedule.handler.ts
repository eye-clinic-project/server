import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppointmentRepository, DoctorAvailabilityRepository } from '../../../../database/repository/index.js';
import { AppointmentRequestStatus, AppointmentRequestType } from '../../../../dependencies/enum/index.js';
import { RequestRescheduleCommand } from '../command/index.js';
import { openWithoutPendingRequest } from './appointment.helper.js';

@CommandHandler(RequestRescheduleCommand)
export class RequestRescheduleHandler implements ICommandHandler<RequestRescheduleCommand> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly availabilityRepository: DoctorAvailabilityRepository,
  ) {}

  async execute({ appointmentId, patientId, slot, rescheduleReason, note }: RequestRescheduleCommand): Promise<boolean> {
    const updated = await this.appointmentRepository.findOneAndUpdate({
      filter: openWithoutPendingRequest(appointmentId, patientId),
      update: {
        $set: {
          changeRequest: {
            type: AppointmentRequestType.RESCHEDULE,
            status: AppointmentRequestStatus.PENDING,
            reason: note ?? rescheduleReason,
            rescheduleReason,
            slot: slot._id,
            scheduledAt: slot.startAt,
            endAt: slot.endAt,
            requestedBy: patientId,
            requestedAt: new Date(),
          },
        },
      },
    });
    if (updated) await this.availabilityRepository.updateOne({ filter: { _id: slot._id }, update: { $set: { appointment: appointmentId } } });
    return !!updated;
  }
}
