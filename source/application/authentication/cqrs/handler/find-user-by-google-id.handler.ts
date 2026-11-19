import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/index.js';
import { UserRepository } from '../../../../database/repository/index.js';
import { FindUserByGoogleIdQuery } from '../query/index.js';

@QueryHandler(FindUserByGoogleIdQuery)
export class FindUserByGoogleIdHandler implements IQueryHandler<FindUserByGoogleIdQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ googleId }: FindUserByGoogleIdQuery): Promise<HUserDocument | null> {
    return this.userRepository.findOne({ filter: { googleId }, projection: '+googleId' });
  }
}
