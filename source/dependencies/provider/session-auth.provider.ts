import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, SessionCookieProvider, type SessionRecord } from '@nestjs/authentication';
import { IUser } from '../interface/index.js';
import { UserRepository } from '../../database/repository/index.js';

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
