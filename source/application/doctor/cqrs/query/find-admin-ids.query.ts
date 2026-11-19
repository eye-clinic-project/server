import { Query } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class FindAdminIdsQuery extends Query<Types.ObjectId[]> {}
