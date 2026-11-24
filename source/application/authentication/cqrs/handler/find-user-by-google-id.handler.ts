import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/user.model.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { FindUserByGoogleIdQuery } from '../query/find-user-by-google-id.query.js';

@QueryHandler(FindUserByGoogleIdQuery)
export class FindUserByGoogleIdHandler implements IQueryHandler<FindUserByGoogleIdQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ googleId }: FindUserByGoogleIdQuery): Promise<HUserDocument | null> {
    return this.userRepository.findOne({ filter: { googleId }, projection: '+googleId' });
  }
}
