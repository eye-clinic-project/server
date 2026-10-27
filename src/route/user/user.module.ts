import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { UserResolver } from './user.resolver.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/role.guard.js';

@Module({
  controllers: [UserController],
  providers: [UserService, UserResolver, UserRepository, AuthGuard, RolesGuard],
})
export class UserModule {}
