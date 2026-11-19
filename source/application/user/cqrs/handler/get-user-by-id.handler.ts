import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/index.js';
import { UserRepository } from '../../../../database/repository/index.js';
import { GetUserByIdQuery } from '../query/index.js';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ userId }: GetUserByIdQuery): Promise<HUserDocument | null> {
    return this.userRepository.findById({ _id: userId });
  }
}
