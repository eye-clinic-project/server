import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/user.model.js';
import { SetUserActiveCommand } from '../command/set-user-active.command.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';

@CommandHandler(SetUserActiveCommand)
export class SetUserActiveHandler implements ICommandHandler<SetUserActiveCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ userId, isActive }: SetUserActiveCommand): Promise<HUserDocument | null> {
    return this.userRepository.findOneAndUpdate({ filter: { _id: userId }, update: { $set: { isActive } } });
  }
}
