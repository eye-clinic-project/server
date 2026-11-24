import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/user.model.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { UpdateUserCommand } from '../command/update-user.command.js';

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ filter, update }: UpdateUserCommand): Promise<HUserDocument | null> {
    return this.userRepository.findOneAndUpdate({ filter, update });
  }
}
