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
import {
  AdminModule,
  AnalysisModule,
  AppointmentModule,
  AuthenticationModule as AuthModule,
  ChatModule,
  DoctorModule,
  NotificationModule,
  PatientModule,
  UserModule,
} from './application/index.js';
import {
  appConfiguration,
  createAuthenticationOptions,
  createCacheOptions,
  createMailOptions,
  createMongooseOptions,
  createStorageOptions,
  createQueueOptions,
  createThrottlerOptions,
  i18nOptions,
  eventOptions,
} from './configuration/index.js';
import { ServiceModule } from './dependencies/module/index.js';
import { Localize } from './dependencies/language/index.js';
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
