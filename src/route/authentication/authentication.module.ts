import { Module } from '@nestjs/common';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { AuthenticationService } from './authentication.service.js';
import { AuthenticationController } from './authentication.controller.js';

@Module({
  controllers: [AuthenticationController],
  providers: [AuthenticationService, AuthGuard],
})
export class AuthenticationModule {}
