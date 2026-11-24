import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/user.model.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { UpdateUserProfileCommand } from '../command/update-user-profile.command.js';

@CommandHandler(UpdateUserProfileCommand)
export class UpdateUserProfileHandler implements ICommandHandler<UpdateUserProfileCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ userId, profile }: UpdateUserProfileCommand): Promise<HUserDocument | null> {
    return this.userRepository.findByIdAndUpdate({ _id: userId, update: { $set: profile } });
  }
}
