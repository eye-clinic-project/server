import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { AssignPatientCommand } from '../command/index.js';
import { AssignmentStatus } from '../../../../dependencies/enum/index.js';
import { DoctorPatientRepository } from '../../../../database/repository/index.js';

@CommandHandler(AssignPatientCommand)
export class AssignPatientHandler implements ICommandHandler<AssignPatientCommand> {
  constructor(private readonly doctorPatientRepository: DoctorPatientRepository) {}

  async execute({ doctorId, patientUserId }: AssignPatientCommand): Promise<{ created: boolean }> {
    const reactivated = await this.doctorPatientRepository.findOneAndUpdate({
      filter: { doctor: doctorId, patient: patientUserId, status: { $ne: AssignmentStatus.ACTIVE } },
      update: { $set: { status: AssignmentStatus.ACTIVE, assignedAt: new Date(), assignedBy: doctorId, endedAt: null } },
    });
    if (reactivated) return { created: true };

    const active = await this.doctorPatientRepository.findOne({
      filter: { doctor: doctorId, patient: patientUserId, status: AssignmentStatus.ACTIVE },
      projection: { _id: 1 },
      options: { lean: true },
    });
    if (active) return { created: false };

    try {
      await this.doctorPatientRepository.create({
        data: { doctor: doctorId, patient: patientUserId, status: AssignmentStatus.ACTIVE, assignedAt: new Date(), assignedBy: doctorId },
      });
      return { created: true };
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return { created: false };
      throw error;
    }
  }
}
