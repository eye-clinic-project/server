import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { DoctorClinicView } from '../../entity/index.js';
import { GetDoctorProfileQuery } from '../query/index.js';
import { DoctorRepository } from '../../../../database/repository/index.js';

@QueryHandler(GetDoctorProfileQuery)
export class GetDoctorProfileHandler implements IQueryHandler<GetDoctorProfileQuery> {
  constructor(private readonly doctorRepository: DoctorRepository) {}

  execute({ userId }: GetDoctorProfileQuery): Promise<DoctorClinicView | null> {
    return this.doctorRepository.findOne({ filter: { user: userId }, options: { lean: true } });
  }
}
