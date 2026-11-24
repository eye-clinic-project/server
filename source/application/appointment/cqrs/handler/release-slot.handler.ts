import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { DoctorAvailabilityRepository } from '../../../../database/repository/doctor-availability.repository.js';
import { ReleaseSlotCommand } from '../command/release-slot.command.js';

@CommandHandler(ReleaseSlotCommand)
export class ReleaseSlotHandler implements ICommandHandler<ReleaseSlotCommand> {
  constructor(private readonly availabilityRepository: DoctorAvailabilityRepository) {}

  async execute({ slotId, appointmentId }: ReleaseSlotCommand): Promise<void> {
    await this.availabilityRepository.updateOne({
      filter: { _id: slotId, ...(appointmentId && { $or: [{ appointment: appointmentId }, { appointment: null }] }) },
      update: { $set: { isBooked: false, appointment: null } },
    });
  }
}
