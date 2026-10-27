import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import configuration from './core/configuration/configuration.js';

import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor.js';
import { TransformInterceptor } from './common/interceptor/transform.interceptor.js';
import { TimeoutInterceptor } from './common/interceptor/timeout.interceptor.js';
import { LanguageInterceptor } from './common/interceptor/language.interceptor.js';
import { CacheInterceptor } from './common/interceptor/cache.interceptor.js';
import { AuthenticationModule } from './route/authentication/authentication.module.js';
import { MessageModule } from './route/message/message.module.js';
import { DoctorModule } from './route/doctor/doctor.module.js';
import { AnalysisModule } from './route/analysis/analysis.module.js';
import { ReportModule } from './route/report/report.module.js';
import { ChatModule } from './route/chat/chat.module.js';
import { NotificationModule } from './route/notification/notification.module.js';
import { UserModule } from './route/user/user.module.js';
import { AppointmentModule } from './route/appointment/appointment.module.js';
import { ServiceModule } from './common/module/service.module.js';
import { CacheModule } from './common/module/cache.module.js';
import { DatabaseModule } from './common/module/database.module.js';
import { PatientModule } from './route/patient/patient.module.js';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import type { Request } from 'express';
import { AcceptLanguageResolver, I18nJsonLoader, I18nModule } from 'nestjs-i18n';
import { join } from 'node:path';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env'],
      load: [configuration],
      isGlobal: true,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: join(import.meta.dirname, 'i18n'),
        watch: process.env.NODE_ENV !== 'production',
      },
      resolvers: [AcceptLanguageResolver],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      sortSchema: true,
      context: (context: { req: Request }) => ({ req: context.req }),
    }),
    ServiceModule,
    CacheModule,
    DatabaseModule,
    MessageModule,
    AuthenticationModule,
    DoctorModule,
    AnalysisModule,
    ReportModule,
    AppointmentModule,
    ChatModule,
    UserModule,
    NotificationModule,
    PatientModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LanguageInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
