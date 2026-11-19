import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AssignmentStatus } from '../../../../dependencies/enum/index.js';
import { DoctorPatientRepository } from '../../../../database/repository/index.js';
import { IsPatientAssignedQuery } from '../query/index.js';

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
