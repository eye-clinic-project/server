import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityService } from './security.service.js';

@Module({
  imports: [ConfigModule],
  providers: [SecurityService],
  exports: [SecurityService],
})
export class SecurityModule {}
