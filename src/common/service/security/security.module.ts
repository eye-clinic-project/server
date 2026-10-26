
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EncryptionService } from './encryption.service.js';
import { HashingService } from './hash.service.js';

@Module({
  imports: [ConfigModule],
  providers: [EncryptionService, HashingService],
  exports: [EncryptionService, HashingService],
})
export class SecurityModule {}
