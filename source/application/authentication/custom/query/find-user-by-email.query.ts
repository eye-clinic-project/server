import { Query } from '@nestjs/cqrs';
import type { HUserDocument } from '../../../../database/model/user.model.js';

export class FindUserByEmailQuery extends Query<HUserDocument | null> {
  constructor(public readonly email: string) {
    super();
  }
}
