import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ServiceModule } from './dependency/module/service.module.js';
import { CacheInterceptor } from './dependency/interceptor/cache.interceptor.js';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import appConfiguration from './configuration/app.configuration.js';
import { AuthenticationModule } from './application/authentication/authentication.module.js';
import { UserModule } from './application/user/user.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LoggingInterceptor } from './dependency/interceptor/logging.interceptor.js';
import { TransformInterceptor } from './dependency/interceptor/transform.interceptor.js';
import { TimeoutInterceptor } from './dependency/interceptor/timeout.interceptor.js';
import { LanguageInterceptor } from './dependency/interceptor/language.interceptor.js';
import { DatabaseModule } from './dependency/module/database.module.js';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      load: [appConfiguration],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60_000,
          limit: 25,
        },
      ],
    }),
    ServiceModule,
    DatabaseModule,
    AuthenticationModule,
    UserModule,
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
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) { }
}
