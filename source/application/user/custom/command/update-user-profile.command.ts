import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { HUserDocument } from '../../../../database/model/user.model.js';
import type { EditableProfile } from '../../type/user.type.js';

export class UpdateUserProfileCommand extends Command<HUserDocument | null> {
  constructor(
    public readonly userId: Types.ObjectId,
    public readonly profile: EditableProfile,
  ) {
    super();
  }
}
