import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import appConfiguration from './configuration/app.configuration.js';
import { ServiceModule } from './dependency/module/service.module.js';
import { DatabaseModule } from './dependency/module/database.module.js';
import { CacheInterceptor } from './dependency/interceptor/cache.interceptor.js';
import { LoggingInterceptor } from './dependency/interceptor/logging.interceptor.js';
import { TransformInterceptor } from './dependency/interceptor/transform.interceptor.js';
import { TimeoutInterceptor } from './dependency/interceptor/timeout.interceptor.js';
import { LanguageInterceptor } from './dependency/interceptor/language.interceptor.js';
import { MaintenanceMiddleware } from './dependency/middleware/maintenance-mode-middleware.js';
import { SlowRequestMiddleware } from './dependency/middleware/response-time.middleware.js';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthenticationModule } from './application/authentication/authentication.module.js';
import { UserModule } from './application/user/user.module.js';
import { DoctorsModule } from './application/doctor/doctors.module.js';
import { PatientModule } from './application/patient/patient.module.js';
import { DoctorPatientModule } from './application/doctor-patient/doctor-patient.module.js';
import { FundusImageModule } from './application/fundus-image/fundus-image.module.js';
import { AnalysisModule } from './application/analysis/analysis.module.js';
import { DoctorReviewModule } from './application/doctor-review/doctor-review.module.js';
import { ReportModule } from './application/report/report.module.js';
import { AppointmentModule } from './application/appointment/appointment.module.js';
import { DoctorAvailabilityModule } from './application/doctor-availability/doctor-availability.module.js';
import { ConversationModule } from './application/conversation/conversation.module.js';
import { NotificationModule } from './application/notification/notification.module.js';
import { HardwareModule } from './application/hardware/hardware.module.js';
import { AdminModule } from './application/admin/admin.module.js';
import { SystemModule } from './application/system/system.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      load: [appConfiguration],
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: parseInt(process.env.THROTTLE_LIMIT ?? '', 10) || 120 }],
      // Only for automated tests; never set this in production.
      skipIf: () => process.env.THROTTLE_DISABLED === 'true',
    }),
    ServiceModule,
    DatabaseModule,
    AuthenticationModule,
    UserModule,
    DoctorsModule,
    PatientModule,
    DoctorPatientModule,
    FundusImageModule,
    AnalysisModule,
    DoctorReviewModule,
    ReportModule,
    AppointmentModule,
    DoctorAvailabilityModule,
    ConversationModule,
    NotificationModule,
    HardwareModule,
    AdminModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LanguageInterceptor },
    { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MaintenanceMiddleware, SlowRequestMiddleware).forRoutes({
      path: '*splat',
      method: RequestMethod.ALL,
    });
  }
}
