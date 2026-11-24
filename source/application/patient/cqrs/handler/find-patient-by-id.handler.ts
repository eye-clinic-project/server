import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { FindPatientByIdQuery } from '../query/find-patient-by-id.query.js';
import { PATIENT_USER_FIELDS } from '../../entity/patient.type.js';
import { PatientView } from '../../entity/patient.entity.js';
import { PatientRepository } from '../../../../database/repository/patient.repository.js';

const populateUser = [{ path: 'user', select: PATIENT_USER_FIELDS }];

@QueryHandler(FindPatientByIdQuery)
export class FindPatientByIdHandler implements IQueryHandler<FindPatientByIdQuery> {
  constructor(private readonly patientRepository: PatientRepository) {}

  execute({ patientId }: FindPatientByIdQuery): Promise<PatientView | null> {
    return this.patientRepository.findById({ _id: patientId, options: { lean: true, populate: populateUser } });
  }
}
