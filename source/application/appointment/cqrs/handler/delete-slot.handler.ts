import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import type { SlotView } from '../../entity/appointment.type.js';
import { DeleteSlotCommand, type DeleteSlotResult } from '../command/delete-slot.command.js';
import { DoctorAvailabilityRepository } from '../../../../database/repository/doctor-availability.repository.js';

@CommandHandler(DeleteSlotCommand)
export class DeleteSlotHandler implements ICommandHandler<DeleteSlotCommand> {
  constructor(private readonly availabilityRepository: DoctorAvailabilityRepository) {}

  async execute({ doctorId, slotId }: DeleteSlotCommand): Promise<DeleteSlotResult> {
    const { deletedCount } = await this.availabilityRepository.deleteOne({ filter: { _id: slotId, doctor: doctorId, isBooked: false } });
    if (deletedCount) return 'deleted';

    const slot: SlotView | null = await this.availabilityRepository.findById({ _id: slotId, options: { lean: true } });
    if (!slot) return 'notFound';
    if (!slot.doctor.equals(doctorId)) return 'notOwner';
    return 'booked';
  }
}
