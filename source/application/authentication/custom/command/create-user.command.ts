import { Command } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/user.model.js';
import type { IUser } from '../../../../dependencies/interface/database.interface.js';

export class CreateUserCommand extends Command<HUserDocument> {
  constructor(public readonly data: Partial<IUser>) {
    super();
  }
}
