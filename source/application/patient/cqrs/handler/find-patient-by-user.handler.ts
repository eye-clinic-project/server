import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindPatientByUserQuery } from '../query/index.js';
import { PATIENT_USER_FIELDS, PatientView } from '../../entity/index.js';
import { PatientRepository } from '../../../../database/repository/index.js';

const populateUser = [{ path: 'user', select: PATIENT_USER_FIELDS }];

@QueryHandler(FindPatientByUserQuery)
export class FindPatientByUserHandler implements IQueryHandler<FindPatientByUserQuery> {
  constructor(private readonly patientRepository: PatientRepository) {}

  execute({ userId }: FindPatientByUserQuery): Promise<PatientView | null> {
    return this.patientRepository.findOne({ filter: { user: userId }, options: { lean: true, populate: populateUser } });
  }
}
