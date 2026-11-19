import { Query } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/index.js';

export class FindUserByGoogleIdQuery extends Query<HUserDocument | null> {
  constructor(public readonly googleId: string) {
    super();
  }
}
