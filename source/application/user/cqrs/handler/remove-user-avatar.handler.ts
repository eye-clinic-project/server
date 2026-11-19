import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/index.js';
import { UserRepository } from '../../../../database/repository/index.js';
import { RemoveUserAvatarCommand } from '../command/index.js';

@CommandHandler(RemoveUserAvatarCommand)
export class RemoveUserAvatarHandler implements ICommandHandler<RemoveUserAvatarCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ userId }: RemoveUserAvatarCommand): Promise<HUserDocument | null> {
    return this.userRepository.findByIdAndUpdate({ _id: userId, update: { $unset: { avatarUrl: 1 } } });
  }
}
