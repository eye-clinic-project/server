import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { HUserDocument } from '../../../../database/model/user.model.js';

export class GetUserByIdQuery extends Query<HUserDocument | null> {
  constructor(public readonly userId: Types.ObjectId) {
    super();
  }
}
