import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppointmentRepository } from '../../../../database/repository/index.js';
import { DeleteAppointmentCommand } from '../command/index.js';

@CommandHandler(DeleteAppointmentCommand)
export class DeleteAppointmentHandler implements ICommandHandler<DeleteAppointmentCommand> {
  constructor(private readonly appointmentRepository: AppointmentRepository) {}

  async execute({ appointmentId }: DeleteAppointmentCommand): Promise<void> {
    await this.appointmentRepository.deleteOne({ filter: { _id: appointmentId } });
  }
}
