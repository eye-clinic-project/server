import { Query } from '@nestjs/cqrs';

import type { HUserDocument } from '../../../../database/model/index.js';

export class FindUserByEmailQuery extends Query<HUserDocument | null> {
  constructor(public readonly email: string) {
    super();
  }
}
