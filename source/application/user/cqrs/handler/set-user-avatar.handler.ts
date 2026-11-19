import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/index.js';
import { UserRepository } from '../../../../database/repository/index.js';
import { SetUserAvatarCommand } from '../command/index.js';

@CommandHandler(SetUserAvatarCommand)
export class SetUserAvatarHandler implements ICommandHandler<SetUserAvatarCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ userId, avatarUrl }: SetUserAvatarCommand): Promise<HUserDocument | null> {
    return this.userRepository.findByIdAndUpdate({ _id: userId, update: { $set: { avatarUrl } } });
  }
}
