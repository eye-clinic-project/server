import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service.js';
import { AuthenticationController } from './authentication.controller.js';
import { UserModule } from '../user/user.module.js';

@Module({
  imports: [UserModule],
  controllers: [AuthenticationController],
  providers: [AuthenticationService],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
