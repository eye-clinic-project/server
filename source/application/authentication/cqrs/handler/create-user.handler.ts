import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/index.js';
import { UserRepository } from '../../../../database/repository/index.js';
import { CreateUserCommand } from '../command/index.js';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ data }: CreateUserCommand): Promise<HUserDocument> {
    return this.userRepository.create({ data });
  }
}
