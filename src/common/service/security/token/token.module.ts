
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenService } from './token.service.js';
import { RedisService } from '../../redis/redis.service.js';
import { JwtModule } from '@nestjs/jwt';




@Global()
@Module({
  imports: [
    ConfigModule,
    RedisService,
    JwtModule.register({}),
  ],
  providers: [TokenService ],
  exports: [TokenService],
})
export class SecurityModule {}
