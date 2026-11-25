import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service.js';
import { AuthenticationController } from './authentication.controller.js';
import { JwtAuth } from '../../dependencies/provider/jwt-auth.provider.js';
import { DatabaseModule } from '../../dependencies/module/database.module.js';
import { ServiceModule } from '../../dependencies/module/service.module.js';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bullmq';
import { AUTHENTICATION_QUEUE, AuthenticationProcessor } from './queue/authentication.queue.js';
import { AuthenticateListener } from './event/authentication.listener.js';
import { CreateDoctorProfileHandler } from './custom/handler/create-doctor-profile.handler.js';
import { CreateUserHandler } from './custom/handler/create-user.handler.js';
import { FindUserByEmailHandler } from './custom/handler/find-user-by-email.handler.js';
import { FindUserByGoogleIdHandler } from './custom/handler/find-user-by-google-id.handler.js';
import { IsLicenseTakenHandler } from './custom/handler/is-license-taken.handler.js';
import { UpdateUserHandler } from './custom/handler/update-user.handler.js';
import { GoogleIdentityService } from '../../dependencies/service/google.service.js';
import { JwtTokenService } from '../../dependencies/service/token.service.js';

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
