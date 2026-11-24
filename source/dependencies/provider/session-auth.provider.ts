import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, SessionCookieProvider, type SessionRecord } from '@nestjs/authentication';
import { IUser } from '../interface/database.interface.js';
import { UserRepository } from '../../database/repository/user.repository.js';

@Injectable()
export class SessionAuth extends SessionCookieProvider<IUser> {
  constructor(
    private readonly userRepository: UserRepository,
    registry: AuthenticationRegistry,
  ) {
    super();
    registry.registerProvider(this);
  }

  validate(session: SessionRecord) {
    return this.userRepository.findById({ _id: session.userId });
  }
}
