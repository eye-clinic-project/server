import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/user.model.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { CreateUserCommand } from '../command/create-user.command.js';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ data }: CreateUserCommand): Promise<HUserDocument> {
    return this.userRepository.create({ data });
  }
}
