import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { DoctorAvailabilityRepository } from '../../../../database/repository/index.js';
import { ReleaseSlotCommand } from '../command/index.js';

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
