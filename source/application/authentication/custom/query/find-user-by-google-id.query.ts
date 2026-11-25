import { Query } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/user.model.js';

export class FindUserByGoogleIdQuery extends Query<HUserDocument | null> {
  constructor(public readonly googleId: string) {
    super();
  }
}
