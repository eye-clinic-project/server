import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationModule } from '@nestjs/authentication';
import { CacheModule } from '@nestjs/cache-manager';
import { I18nModule } from '@nestjs/i18n';
import { MailModule } from '@nestjs/mail';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageModule } from '@nestjs/storage';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AdminModule } from './application/admin/admin.module.js';
import { AnalysisModule } from './application/analysis/analysis.module.js';
import { AppointmentModule } from './application/appointment/appointment.module.js';
import { AuthenticationModule as AuthModule } from './application/authentication/authentication.module.js';
import { ChatModule } from './application/chat/chat.module.js';
import { DoctorModule } from './application/doctor/doctor.module.js';
import { NotificationModule } from './application/notification/notification.module.js';
import { PatientModule } from './application/patient/patient.module.js';
import { UserModule } from './application/user/user.module.js';
import { appConfiguration } from './configuration/app.configuration.js';
import { createAuthenticationOptions } from './configuration/authentication.configuration.js';
import { createCacheOptions } from './configuration/cache.configuration.js';
import { createMailOptions } from './configuration/mail.configuration.js';
import { createMongooseOptions } from './configuration/database.configuration.js';
import { createStorageOptions } from './configuration/storage.configuration.js';
import { createQueueOptions } from './configuration/queue.configuration.js';
import { createThrottlerOptions } from './configuration/throttler.configuration.js';
import { i18nOptions } from './configuration/i18n.configuration.js';
import { eventOptions } from './configuration/event.configuration.js';
import { ServiceModule } from './dependencies/module/service.module.js';
import { Localize } from './dependencies/language/localize.js';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';

const inject = [ConfigService];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      load: [appConfiguration],
    }),
    ThrottlerModule.forRoot(createThrottlerOptions()),
    I18nModule.forRoot(i18nOptions),
    StorageModule.forRootAsync({ inject, useFactory: createStorageOptions }),
    CacheModule.registerAsync({ isGlobal: true, inject, useFactory: createCacheOptions }),
    MongooseModule.forRootAsync({ inject, useFactory: createMongooseOptions }),
    MailModule.forRootAsync({ inject, useFactory: createMailOptions }),
    EventEmitterModule.forRoot(eventOptions),
    BullModule.forRootAsync({ inject, useFactory: createQueueOptions }),
    AuthenticationModule.forRootAsync({ inject, useFactory: createAuthenticationOptions }),
    AuthModule,
    UserModule,
    ServiceModule,
    PatientModule,
    AnalysisModule,
    AdminModule,
    DoctorModule,
    AppointmentModule,
    ChatModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService, Localize, ThrottlerGuard],
})
export class AppModule {}
