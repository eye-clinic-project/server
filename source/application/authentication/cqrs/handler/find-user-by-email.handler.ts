import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/index.js';
import { UserRepository } from '../../../../database/repository/index.js';
import { FindUserByEmailQuery } from '../query/index.js';

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
