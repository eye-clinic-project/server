
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '../redis/redis.module.js';
import { UserRepository } from '../../../core/database/repository/user.repository.js';
import { EncryptionService } from './encryption.service.js';
import { HashingService } from './hash.service.js';
import { TokenService } from './token.service.js';

@Global()
@Module({
  imports: [ConfigModule, JwtModule.register({}), RedisModule],
  providers: [EncryptionService, HashingService, TokenService, UserRepository],
  exports: [EncryptionService, HashingService, TokenService],
})
export class SecurityModule {}
