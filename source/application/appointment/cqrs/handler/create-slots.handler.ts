import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import type { SlotView } from '../../entity/appointment.type.js';
import { CreateSlotsCommand } from '../command/create-slots.command.js';
import { DoctorAvailabilityRepository } from '../../../../database/repository/doctor-availability.repository.js';

@CommandHandler(CreateSlotsCommand)
export class CreateSlotsHandler implements ICommandHandler<CreateSlotsCommand> {
  constructor(private readonly availabilityRepository: DoctorAvailabilityRepository) {}

  async execute({ doctorId, slots }: CreateSlotsCommand): Promise<SlotView[]> {
    const rangeStart = slots[0].startAt;
    const rangeEnd = slots[slots.length - 1].endAt;
    const overlapping = await this.availabilityRepository.findOne({
      filter: { doctor: doctorId, startAt: { $lt: rangeEnd }, endAt: { $gt: rangeStart } },
      projection: { _id: 1 },
      options: { lean: true },
    });
    if (overlapping) throw new ConflictException('This time overlaps with an existing availability slot');

    try {
      const created = await this.availabilityRepository.createMany({ data: slots.map((slot) => ({ ...slot, doctor: doctorId, isBooked: false })) });
      return created.map((slot) => slot.toObject() as SlotView);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw new ConflictException('This time overlaps with an existing availability slot');
      throw error;
    }
  }
}
