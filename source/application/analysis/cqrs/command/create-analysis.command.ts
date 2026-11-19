import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { EyeSide } from '../../../../dependencies/enum/index.js';

export interface NewFundusImage {
  storageKey: string;
  mimeType: string;
  size: number;
  sha256: string;
  originalName?: string;
  eye?: EyeSide;
  notes?: string;
  capturedAt?: Date;
}

export class CreateAnalysisCommand extends Command<Types.ObjectId> {
  constructor(
    public readonly doctorId: Types.ObjectId,
    public readonly patientUserId: Types.ObjectId,
    public readonly image: NewFundusImage,
  ) {
    super();
  }
}
