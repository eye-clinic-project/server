import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

const logger = new Logger('Database');

export const databaseConnection = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    uri: configService.getOrThrow<string>('database.uri'),
    serverSelectionTimeoutMS: 5000,
    onConnectionCreate: (connection: Connection) => {
      connection.on('connected', () => logger.log('connected'));
      connection.on('open', () => logger.log('open'));
      connection.on('reconnected', () => logger.log('reconnected'));
      connection.on('disconnecting', () => logger.warn('disconnecting'));
      connection.on('disconnected', () => logger.warn('disconnected'));
      connection.on('error', (err: Error) => logger.error(err.message, err.stack));

      return connection;
    },
  }),
});

@Global()
@Module({ imports: [databaseConnection], exports: [databaseConnection] })
export class DatabaseModule {}