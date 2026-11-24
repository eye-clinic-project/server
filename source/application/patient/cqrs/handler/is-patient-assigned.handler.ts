import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssignmentStatus } from '../../../../dependencies/enum/database.enum.js';
import { DoctorPatientRepository } from '../../../../database/repository/doctor-patient.repository.js';
import { IsPatientAssignedQuery } from '../query/is-patient-assigned.query.js';

@QueryHandler(IsPatientAssignedQuery)
export class IsPatientAssignedHandler implements IQueryHandler<IsPatientAssignedQuery> {
  constructor(private readonly doctorPatientRepository: DoctorPatientRepository) {}

  async execute({ doctorId, patientUserId }: IsPatientAssignedQuery): Promise<boolean> {
    const assignment = await this.doctorPatientRepository.findOne({
      filter: { doctor: doctorId, patient: patientUserId, status: AssignmentStatus.ACTIVE },
      projection: { _id: 1 },
      options: { lean: true },
    });
    return !!assignment;
  }
}
