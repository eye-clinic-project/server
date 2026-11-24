import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { DoctorClinicView } from '../../entity/doctor.type.js';
import { GetDoctorProfileQuery } from '../query/get-doctor-profile.query.js';
import { DoctorRepository } from '../../../../database/repository/doctor.repository.js';

@QueryHandler(GetDoctorProfileQuery)
export class GetDoctorProfileHandler implements IQueryHandler<GetDoctorProfileQuery> {
  constructor(private readonly doctorRepository: DoctorRepository) {}

  execute({ userId }: GetDoctorProfileQuery): Promise<DoctorClinicView | null> {
    return this.doctorRepository.findOne({ filter: { user: userId }, options: { lean: true } });
  }
}
