import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { Types } from 'mongoose';
import { FindAdminIdsQuery } from '../query/find-admin-ids.query.js';
import { SystemRoleEnum } from '../../../../dependencies/enum/security.enum.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';

@QueryHandler(FindAdminIdsQuery)
export class FindAdminIdsHandler implements IQueryHandler<FindAdminIdsQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(): Promise<Types.ObjectId[]> {
    const admins: { _id: Types.ObjectId }[] = await this.userRepository.find({
      filter: { role: SystemRoleEnum.ADMIN, isActive: { $ne: false } },
      projection: { _id: 1 },
      options: { lean: true, limit: 100 },
    });
    return admins.map((admin) => admin._id);
  }
}
