import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';

import { DoctorRepository } from '../../../../database/repository/doctor.repository.js';
import { IsLicenseTakenQuery } from '../query/is-license-taken.query.js';

@QueryHandler(IsLicenseTakenQuery)
export class IsLicenseTakenHandler implements IQueryHandler<IsLicenseTakenQuery> {
  constructor(private readonly doctorRepository: DoctorRepository) {}

  async execute({ licenseNumber }: IsLicenseTakenQuery): Promise<boolean> {
    return !!(await this.doctorRepository.findOne({ filter: { licenseNumber }, projection: { _id: 1 }, options: { lean: true } }));
  }
}
