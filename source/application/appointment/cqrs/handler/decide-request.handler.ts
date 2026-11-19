import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppointmentRepository } from '../../../../database/repository/index.js';
import { AppointmentRequestStatus, AppointmentRequestType, AppointmentStatus, SystemRoleEnum } from '../../../../dependencies/enum/index.js';
import { DecideRequestCommand } from '../command/index.js';

@CommandHandler(DecideRequestCommand)
export class DecideRequestHandler implements ICommandHandler<DecideRequestCommand> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute({ appointment, doctorId, approve, note }: DecideRequestCommand): Promise<boolean> {
    const request = appointment.changeRequest!;
    const now = new Date();
    const decision = {
      'changeRequest.status': approve ? AppointmentRequestStatus.APPROVED : AppointmentRequestStatus.REJECTED,
      'changeRequest.decidedBy': doctorId,
      'changeRequest.decidedAt': now,
      'changeRequest.decisionNote': note ?? null,
    };

    const outcome = !approve
      ? { $set: decision }
      : request.type === AppointmentRequestType.CANCEL
        ? { $set: { ...decision, status: AppointmentStatus.CANCELLED, cancelledBy: request.requestedBy, cancelReason: request.reason } }
        : {
            $set: { ...decision, slot: request.slot, scheduledAt: request.scheduledAt, endAt: request.endAt, status: AppointmentStatus.CONFIRMED },
            $push: {
              rescheduleHistory: {
                from: appointment.scheduledAt,
                to: request.scheduledAt,
                reason: request.rescheduleReason,
                note: request.reason,
                by: request.requestedBy,
                byRole: SystemRoleEnum.PATIENT,
                at: now,
              },
            },
          };

    const updated = await this.appointmentRepository.findOneAndUpdate({
      filter: {
        _id: appointment._id,
        doctor: doctorId,
        'changeRequest.status': AppointmentRequestStatus.PENDING,
        'changeRequest.requestedAt': request.requestedAt,
      },
      update: outcome,
    });
    return !!updated;
  }
}
