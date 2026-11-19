import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/index.js';
import { UserRepository } from '../../../../database/repository/index.js';
import { UpdateUserProfileCommand } from '../command/index.js';

@CommandHandler(UpdateUserProfileCommand)
export class UpdateUserProfileHandler implements ICommandHandler<UpdateUserProfileCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  execute({ userId, profile }: UpdateUserProfileCommand): Promise<HUserDocument | null> {
    return this.userRepository.findByIdAndUpdate({ _id: userId, update: { $set: profile } });
  }
}
