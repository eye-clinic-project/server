import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AssignmentStatus } from '../../../../dependencies/enum/database.enum.js';
import { DoctorPatientRepository } from '../../../../database/repository/doctor-patient.repository.js';
import { UnassignPatientCommand } from '../command/unassign-patient.command.js';

@CommandHandler(UnassignPatientCommand)
export class UnassignPatientHandler implements ICommandHandler<UnassignPatientCommand> {
  constructor(private readonly doctorPatientRepository: DoctorPatientRepository) {}

  async execute({ doctorId, patientUserId }: UnassignPatientCommand): Promise<boolean> {
    const ended = await this.doctorPatientRepository.findOneAndUpdate({
      filter: { doctor: doctorId, patient: patientUserId, status: { $ne: AssignmentStatus.ENDED } },
      update: { $set: { status: AssignmentStatus.ENDED, endedAt: new Date() } },
    });
    return !!ended;
  }
}
