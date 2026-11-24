import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppointmentRepository } from '../../../../database/repository/appointment.repository.js';
import { DeleteAppointmentCommand } from '../command/delete-appointment.command.js';

@CommandHandler(DeleteAppointmentCommand)
export class DeleteAppointmentHandler implements ICommandHandler<DeleteAppointmentCommand> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute({ appointmentId }: DeleteAppointmentCommand): Promise<void> {
    await this.appointmentRepository.deleteOne({ filter: { _id: appointmentId } });
  }
}
