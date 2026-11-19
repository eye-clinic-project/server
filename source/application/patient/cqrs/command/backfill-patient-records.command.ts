import { Command } from '@nestjs/cqrs';

export class BackfillPatientRecordsCommand extends Command<number> {}
