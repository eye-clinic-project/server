import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/user.model.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { FindUserByEmailQuery } from '../query/find-user-by-email.query.js';

@QueryHandler(FindUserByEmailQuery)
export class FindUserByEmailHandler implements IQueryHandler<FindUserByEmailQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ email }: FindUserByEmailQuery): Promise<HUserDocument | null> {
    return this.userRepository.findOne({
      filter: { email: email.trim().toLowerCase() },
      projection: '+passwordHash +googleId',
    });
  }
}
