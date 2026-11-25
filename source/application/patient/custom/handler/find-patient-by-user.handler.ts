import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindPatientByUserQuery } from '../query/find-patient-by-user.query.js';
import { PATIENT_USER_FIELDS } from '../../type/patient.type.js';
import { PatientView } from '../../entity/patient.entity.js';
import { PatientRepository } from '../../../../database/repository/patient.repository.js';

const populateUser = [{ path: 'user', select: PATIENT_USER_FIELDS }];

@QueryHandler(FindPatientByUserQuery)
export class FindPatientByUserHandler implements IQueryHandler<FindPatientByUserQuery> {
  constructor(private readonly patientRepository: PatientRepository) {}

  execute({ userId }: FindPatientByUserQuery): Promise<PatientView | null> {
    return this.patientRepository.findOne({ filter: { user: userId }, options: { lean: true, populate: populateUser } });
  }
}
