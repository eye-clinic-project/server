import { Command } from '@nestjs/cqrs';
import type { QueryFilter, UpdateQuery } from 'mongoose';

import type { HUserDocument } from '../../../../database/model/index.js';
import type { IUser } from '../../../../dependencies/interface/index.js';

export class UpdateUserCommand extends Command<HUserDocument | null> {
  constructor(
    public readonly filter: QueryFilter<IUser>,
    public readonly update: UpdateQuery<IUser>,
  ) {
    super();
  }
}
