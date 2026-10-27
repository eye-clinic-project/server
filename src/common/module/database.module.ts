import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../core/database/model/user.model.js';
import { Doctor, DoctorSchema } from '../../core/database/model/doctor.model.js';
import { Patient, PatientSchema } from '../../core/database/model/patient.model.js';
import { Appointment, AppointmentSchema } from '../../core/database/model/appointment.model.js';
import { Conversation, ConversationSchema } from '../../core/database/model/conversation.model.js';
import { Message, MessageSchema } from '../../core/database/model/message.model.js';
import { Analysis, AnalysisSchema } from '../../core/database/model/analysis.model.js';
import { Report, ReportSchema } from '../../core/database/model/report.model.js';
import { Notification, NotificationSchema } from '../../core/database/model/notification.model.js';

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
      connection.on('error', (err: Error) =>
        logger.error(err.message, err.stack),
      );

      return connection;
    },
  }),
});

const models = MongooseModule.forFeature([
  { name: User.name, schema: UserSchema },
  { name: Doctor.name, schema: DoctorSchema },
  { name: Patient.name, schema: PatientSchema },
  { name: Appointment.name, schema: AppointmentSchema },
  { name: Conversation.name, schema: ConversationSchema },
  { name: Message.name, schema: MessageSchema },
  { name: Analysis.name, schema: AnalysisSchema },
  { name: Report.name, schema: ReportSchema },
  { name: Notification.name, schema: NotificationSchema },
]);

@Global()
@Module({ imports: [databaseConnection , models], exports: [databaseConnection , models] })
export class DatabaseModule {}
