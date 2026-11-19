import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service.js';
import { AuthenticationController } from './authentication.controller.js';
import { JwtAuth } from '../../dependencies/provider/index.js';
import { DatabaseModule, ServiceModule } from '../../dependencies/module/index.js';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bullmq';
import { AUTHENTICATION_QUEUE, AuthenticationProcessor } from './queue/index.js';
import { AuthenticateListener } from './event/index.js';
import {
  CreateDoctorProfileHandler,
  CreateUserHandler,
  FindUserByEmailHandler,
  FindUserByGoogleIdHandler,
  IsLicenseTakenHandler,
  UpdateUserHandler,
} from './cqrs/handler/index.js';
import { GoogleIdentityService, JwtTokenService } from '../../dependencies/service/index.js';

@Module({
  imports: [ServiceModule, DatabaseModule, CqrsModule.forRoot(), BullModule.registerQueue({ name: AUTHENTICATION_QUEUE })],
  controllers: [AuthenticationController],
  providers: [
    JwtAuth,
    AuthenticationService,
    GoogleIdentityService,
    JwtTokenService,
    AuthenticateListener,
    AuthenticationProcessor,
    FindUserByEmailHandler,
    FindUserByGoogleIdHandler,
    IsLicenseTakenHandler,
    CreateUserHandler,
    UpdateUserHandler,
    CreateDoctorProfileHandler,
  ],
})
export class AuthenticationModule {}
