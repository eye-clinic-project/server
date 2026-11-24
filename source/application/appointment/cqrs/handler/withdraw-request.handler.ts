import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import type { IAppointment } from '../../../../dependencies/interface/database.interface.js';
import { AppointmentRepository } from '../../../../database/repository/appointment.repository.js';
import { AppointmentRequestStatus } from '../../../../dependencies/enum/database.enum.js';
import { WithdrawRequestCommand } from '../command/withdraw-request.command.js';

@CommandHandler(WithdrawRequestCommand)
export class WithdrawRequestHandler implements ICommandHandler<WithdrawRequestCommand> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  execute({ appointmentId, patientId }: WithdrawRequestCommand): Promise<IAppointment | null> {
    return this.appointmentRepository.findOneAndUpdate({
      filter: { _id: appointmentId, patient: patientId, 'changeRequest.status': AppointmentRequestStatus.PENDING },
      update: { $set: { 'changeRequest.status': AppointmentRequestStatus.WITHDRAWN, 'changeRequest.decidedAt': new Date() } },
      options: { returnDocument: 'before', lean: true },
    });
  }
}
