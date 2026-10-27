import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { AuthenticationService } from './authentication.service.js';
import { AuthenticationController } from './authentication.controller.js';
import { AuthenticationResolver } from './authentication.resolver.js';
import { RolesGuard } from '../../common/guard/role.guard.js';

@Module({
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    AuthenticationResolver,
    AuthGuard,
    RolesGuard,
  ],
})
export class AuthenticationModule {}
