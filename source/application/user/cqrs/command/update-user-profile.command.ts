import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { HUserDocument } from '../../../../database/model/index.js';
import type { IUser } from '../../../../dependencies/interface/index.js';

export type EditableProfile = Partial<Pick<IUser, 'name' | 'city' | 'language'>>;

export class UpdateUserProfileCommand extends Command<HUserDocument | null> {
  constructor(
    public readonly userId: Types.ObjectId,
    public readonly profile: EditableProfile,
  ) {
    super();
  }
}
