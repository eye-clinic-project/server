import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { SlotView } from '../../entity/index.js';
import { ClaimSlotCommand } from '../command/index.js';
import { DoctorAvailabilityRepository } from '../../../../database/repository/index.js';

@CommandHandler(ClaimSlotCommand)
export class ClaimSlotHandler implements ICommandHandler<ClaimSlotCommand> {
  constructor(private readonly availabilityRepository: DoctorAvailabilityRepository) {}

  execute({ slotId, doctorId }: ClaimSlotCommand): Promise<SlotView | null> {
    return this.availabilityRepository.findOneAndUpdate({
      filter: { _id: slotId, doctor: doctorId, isBooked: false, startAt: { $gt: new Date() } },
      update: { $set: { isBooked: true } },
      options: { lean: true },
    });
  }
}
