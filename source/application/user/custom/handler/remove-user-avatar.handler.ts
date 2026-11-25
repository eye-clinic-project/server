import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/user.model.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { RemoveUserAvatarCommand } from '../command/remove-user-avatar.command.js';

@CommandHandler(RemoveUserAvatarCommand)
export class RemoveUserAvatarHandler implements ICommandHandler<RemoveUserAvatarCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ userId }: RemoveUserAvatarCommand): Promise<HUserDocument | null> {
    return this.userRepository.findByIdAndUpdate({ _id: userId, update: { $unset: { avatarUrl: 1 } } });
  }
}
