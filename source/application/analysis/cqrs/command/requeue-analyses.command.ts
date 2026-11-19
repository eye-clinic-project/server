import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class RequeueAnalysesCommand extends Command<Types.ObjectId[]> {}
