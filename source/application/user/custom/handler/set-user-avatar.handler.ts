import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/user.model.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { SetUserAvatarCommand } from '../command/set-user-avatar.command.js';

@CommandHandler(SetUserAvatarCommand)
export class SetUserAvatarHandler implements ICommandHandler<SetUserAvatarCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ userId, avatarUrl }: SetUserAvatarCommand): Promise<HUserDocument | null> {
    return this.userRepository.findByIdAndUpdate({ _id: userId, update: { $set: { avatarUrl } } });
  }
}
