import { Command } from '@nestjs/cqrs';

export class EnsureAdminCommand extends Command<boolean> {
  constructor(
    public readonly email: string,
    public readonly passwordHash: string,
  ) {
    super();
  }
}
