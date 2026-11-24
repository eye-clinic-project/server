import { QueryHandler, type IQueryHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/user.model.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { GetUserByIdQuery } from '../query/get-user-by-id.query.js';

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ userId }: GetUserByIdQuery): Promise<HUserDocument | null> {
    return this.userRepository.findById({ _id: userId });
  }
}
