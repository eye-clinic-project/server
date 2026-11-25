import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AppointmentRepository } from '../../../../database/repository/appointment.repository.js';
import { DoctorAvailabilityRepository } from '../../../../database/repository/doctor-availability.repository.js';
import { AppointmentStatus } from '../../../../dependencies/enum/database.enum.js';
import { CreateAppointmentCommand } from '../command/create-appointment.command.js';

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
