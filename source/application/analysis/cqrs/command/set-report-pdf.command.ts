import { Command } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

export class SetReportPdfCommand extends Command<void> {
  constructor(
    public readonly reportId: Types.ObjectId,
    public readonly pdfKey: string,
    public readonly pdfSize: number,
  ) {
    super();
  }
}
