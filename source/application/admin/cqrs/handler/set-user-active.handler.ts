import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/index.js';
import { SetUserActiveCommand } from '../command/index.js';
import { UserRepository } from '../../../../database/repository/index.js';

@CommandHandler(SetUserActiveCommand)
export class SetUserActiveHandler implements ICommandHandler<SetUserActiveCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ userId, isActive }: SetUserActiveCommand): Promise<HUserDocument | null> {
    return this.userRepository.findOneAndUpdate({ filter: { _id: userId }, update: { $set: { isActive } } });
  }
}
