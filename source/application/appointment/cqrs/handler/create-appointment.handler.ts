import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppointmentRepository, DoctorAvailabilityRepository } from '../../../../database/repository/index.js';
import { AppointmentStatus } from '../../../../dependencies/enum/index.js';
import { CreateAppointmentCommand } from '../command/index.js';

@CommandHandler(CreateAppointmentCommand)
export class CreateAppointmentHandler implements ICommandHandler<CreateAppointmentCommand> {
  constructor(
    private readonly appointmentRepository: AppointmentRepository,
    private readonly availabilityRepository: DoctorAvailabilityRepository,
  ) {}

  async execute({ patientId, slot, reason }: CreateAppointmentCommand) {
    const appointment = await this.appointmentRepository.create({
      data: {
        doctor: slot.doctor,
        patient: patientId,
        slot: slot._id,
        scheduledAt: slot.startAt,
        endAt: slot.endAt,
        status: AppointmentStatus.CONFIRMED,
        reason,
      },
    });
    await this.availabilityRepository.updateOne({ filter: { _id: slot._id }, update: { $set: { appointment: appointment._id } } });
    return appointment._id;
  }
}
