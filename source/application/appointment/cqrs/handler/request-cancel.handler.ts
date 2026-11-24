import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppointmentRepository } from '../../../../database/repository/appointment.repository.js';
import { AppointmentRequestStatus, AppointmentRequestType } from '../../../../dependencies/enum/database.enum.js';
import { RequestCancelCommand } from '../command/request-cancel.command.js';
import { openWithoutPendingRequest } from './appointment.helper.js';

@CommandHandler(RequestCancelCommand)
export class RequestCancelHandler implements ICommandHandler<RequestCancelCommand> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute({ appointmentId, patientId, reason }: RequestCancelCommand): Promise<boolean> {
    const updated = await this.appointmentRepository.findOneAndUpdate({
      filter: openWithoutPendingRequest(appointmentId, patientId),
      update: {
        $set: {
          changeRequest: {
            type: AppointmentRequestType.CANCEL,
            status: AppointmentRequestStatus.PENDING,
            reason,
            requestedBy: patientId,
            requestedAt: new Date(),
          },
        },
      },
    });
    return !!updated;
  }
}
