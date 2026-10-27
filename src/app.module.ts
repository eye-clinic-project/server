import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './core/database/database.connection.js';
import configuration from './core/configuration/configuration.js';

import { MessageModule } from './module/message/message.module.js';
import { AuthenticationModule } from './module/authentication/authentication.module.js';
import { DoctorModule } from './module/doctor/doctor.module.js';
import { AnalysisModule } from './module/analysis/analysis.module.js';
import { ReportModule } from './module/report/report.module.js';
import { AppointmentModule } from './module/appointment/appointment.module.js';
import { ChatModule } from './module/chat/chat.module.js';
import { UserModule } from './module/user/user.module.js';
import { SchemasModule } from './core/database/database.schema.js';

import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptor/logging.interceptor.js';
import { TransformInterceptor } from './common/interceptor/transform.interceptor.js';
import { TimeoutInterceptor } from './common/interceptor/timeout.interceptor.js';
import { LanguageInterceptor } from './common/interceptor/language.interceptor.js';
import { NotificationModule } from './module/notification/notification.module.js';
import { ServiceModule } from './common/service/service.module.js';
import { CacheInterceptor } from './common/interceptor/cache.interceptor.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ServiceModule,
    DatabaseModule,
    SchemasModule,
    MessageModule,
    AuthenticationModule,
    DoctorModule,
    AnalysisModule,
    ReportModule,
    AppointmentModule,
    ChatModule,
    UserModule,
    NotificationModule,
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
