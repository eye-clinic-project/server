import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { AdminDoctorView } from '../../entity/index.js';
import { FindDoctorQuery } from '../query/index.js';
import { DoctorRepository } from '../../../../database/repository/index.js';

const USER_FIELDS = 'name email city phone avatarUrl isActive emailVerifiedAt createdAt';

@QueryHandler(FindDoctorQuery)
export class FindDoctorHandler implements IQueryHandler<FindDoctorQuery> {
  constructor(private readonly doctorRepository: DoctorRepository) {}

  async execute({ doctorId }: FindDoctorQuery): Promise<AdminDoctorView | null> {
    const doctor = await this.doctorRepository.findOne({
      filter: { _id: doctorId },
      options: { lean: true, populate: [{ path: 'user', select: USER_FIELDS }] },
    });
    return doctor?.user ? (doctor as unknown as AdminDoctorView) : null;
  }
}
