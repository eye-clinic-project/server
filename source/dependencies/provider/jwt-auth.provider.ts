import { Injectable } from '@nestjs/common';
import { AuthenticationRegistry, JwtBearerProvider, type JwtClaims } from '@nestjs/authentication';

import { IUser } from '../interface/database.interface.js';
import { UserRepository } from '../../database/repository/user.repository.js';

@Injectable()
export class JwtAuth extends JwtBearerProvider<IUser> {
  constructor(
    private readonly userRepository: UserRepository,
    registry: AuthenticationRegistry,
  ) {
    super({ realm: 'store' });
    registry.registerProvider(this, { order: 1 });
  }

  validate(claims: JwtClaims) {
    return claims.sub ? this.userRepository.findById({ _id: claims.sub }) : null;
  }
}
