import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindPatientByIdQuery } from '../query/index.js';
import { PATIENT_USER_FIELDS, PatientView } from '../../entity/index.js';
import { PatientRepository } from '../../../../database/repository/index.js';

const populateUser = [{ path: 'user', select: PATIENT_USER_FIELDS }];

@QueryHandler(FindPatientByIdQuery)
export class FindPatientByIdHandler implements IQueryHandler<FindPatientByIdQuery> {
  constructor(private readonly patientRepository: PatientRepository) {}

  execute({ patientId }: FindPatientByIdQuery): Promise<PatientView | null> {
    return this.patientRepository.findById({ _id: patientId, options: { lean: true, populate: populateUser } });
  }
}
