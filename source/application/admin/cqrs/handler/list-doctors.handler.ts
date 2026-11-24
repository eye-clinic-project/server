import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { QueryFilter, Types } from 'mongoose';
import type { AdminDoctorView } from '../../entity/admin.type.js';
import { ListDoctorsQuery } from '../query/list-doctors.query.js';
import type { IDoctor } from '../../../../dependencies/interface/database.interface.js';
import { DoctorRepository } from '../../../../database/repository/doctor.repository.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { SystemRoleEnum } from '../../../../dependencies/enum/security.enum.js';

const USER_FIELDS = 'name email city phone avatarUrl isActive emailVerifiedAt createdAt';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@QueryHandler(ListDoctorsQuery)
export class ListDoctorsHandler implements IQueryHandler<ListDoctorsQuery> {
  constructor(
    private readonly doctorRepository: DoctorRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async execute({ filter: { status, submitted, search, page, size } }: ListDoctorsQuery) {
    const filter: QueryFilter<IDoctor> = {};
    if (status) filter.verificationStatus = status;
    if (submitted !== undefined) filter.verificationSubmittedAt = submitted ? { $ne: null } : null;
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      const users: { _id: Types.ObjectId }[] = await this.userRepository.find({
        filter: { role: SystemRoleEnum.DOCTOR, $or: [{ name: pattern }, { email: pattern }] },
        projection: { _id: 1 },
        options: { lean: true, limit: 1000 },
      });
      filter.$or = [{ user: { $in: users.map((user) => user._id) } }, { licenseNumber: pattern }, { clinicName: pattern }];
    }

    const result = await this.doctorRepository.paginate({
      filter,
      options: { lean: true, sort: { verificationSubmittedAt: -1, createdAt: -1 }, populate: [{ path: 'user', select: USER_FIELDS }] },
      page,
      size,
    });
    return { ...result, docs: (result.docs as AdminDoctorView[]).filter((doctor) => doctor.user) };
  }
}
