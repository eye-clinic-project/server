import { Command } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/index.js';
import type { IUser } from '../../../../dependencies/interface/index.js';

export class CreateUserCommand extends Command<HUserDocument> {
  constructor(public readonly data: Partial<IUser>) {
    super();
  }
}
