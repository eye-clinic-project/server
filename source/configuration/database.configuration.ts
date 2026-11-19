import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { MongooseModuleFactoryOptions } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

export function createMongooseOptions(config: ConfigService): MongooseModuleFactoryOptions {
  return {
    uri: config.getOrThrow<string>('app.database.uri'),
    onConnectionCreate: (connection: Connection) => {
      const logger = new Logger('MONGODB');
      for (const event of ['connected', 'open', 'disconnected', 'reconnected', 'disconnecting']) {
        connection.on(event, () => logger.log(event));
      }
      return connection;
    },
  };
}
