import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { SlotView } from '../../type/appointment.type.js';
import { ClaimSlotCommand } from '../command/claim-slot.command.js';
import { DoctorAvailabilityRepository } from '../../../../database/repository/doctor-availability.repository.js';

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
