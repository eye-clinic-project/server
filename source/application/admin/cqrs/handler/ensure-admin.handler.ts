import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';

import { AuthProviderEnum, SystemRoleEnum } from '../../../../dependencies/enum/index.js';
import { EnsureAdminCommand } from '../command/index.js';
import { UserRepository } from '../../../../database/repository/index.js';

@CommandHandler(EnsureAdminCommand)
export class EnsureAdminHandler implements ICommandHandler<EnsureAdminCommand> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({ email, passwordHash }: EnsureAdminCommand): Promise<boolean> {
    const normalized = email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({ filter: { email: normalized }, projection: { _id: 1 }, options: { lean: true } });
    if (existing) return false;
    await this.userRepository.create({
      data: {
        role: SystemRoleEnum.ADMIN,
        name: 'Administrator',
        email: normalized,
        city: 'System',
        passwordHash,
        provider: AuthProviderEnum.SYSTEM,
        emailVerifiedAt: new Date(),
        consentAcceptedAt: new Date(),
        isActive: true,
        language: 'en',
      },
    });
    return true;
  }
}
