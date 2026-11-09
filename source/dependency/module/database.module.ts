import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../database/model/user.model.js';
import { Doctor, DoctorSchema } from '../../database/model/doctor.model.js';
import { Patient, PatientSchema } from '../../database/model/patient.model.js';
import {
  DoctorPatient,
  DoctorPatientSchema,
} from '../../database/model/doctor-patient.model.js';
import {
  Appointment,
  AppointmentSchema,
} from '../../database/model/appointment.model.js';
import {
  DoctorAvailability,
  DoctorAvailabilitySchema,
} from '../../database/model/doctor-availability.model.js';
import {
  Conversation,
  ConversationSchema,
} from '../../database/model/conversation.model.js';
import { Message, MessageSchema } from '../../database/model/message.model.js';
import {
  FundusImage,
  FundusImageSchema,
} from '../../database/model/fundus-image.model.js';
import {
  Analysis,
  AnalysisSchema,
} from '../../database/model/analysis.model.js';
import {
  DoctorReview,
  DoctorReviewSchema,
} from '../../database/model/doctor-review.model.js';
import { Report, ReportSchema } from '../../database/model/report.model.js';
import {
  Notification,
  NotificationSchema,
} from '../../database/model/notification.model.js';
import { Device, DeviceSchema } from '../../database/model/device.model.js';
import {
  CaptureSession,
  CaptureSessionSchema,
} from '../../database/model/capture-session.model.js';

import { UserRepository } from '../../database/repository/user.repository.js';
import { DoctorRepository } from '../../database/repository/doctor.repository.js';
import { PatientRepository } from '../../database/repository/patient.repository.js';
import { DoctorPatientRepository } from '../../database/repository/doctor-patient.repository.js';
import { AppointmentRepository } from '../../database/repository/appointment.repository.js';
import { DoctorAvailabilityRepository } from '../../database/repository/doctor-availability.repository.js';
import { ConversationRepository } from '../../database/repository/conversation.repository.js';
import { MessageRepository } from '../../database/repository/message.repository.js';
import { FundusImageRepository } from '../../database/repository/fundus-image.repository.js';
import { AnalysisRepository } from '../../database/repository/analysis.repository.js';
import { DoctorReviewRepository } from '../../database/repository/doctor-review.repository.js';
import { ReportRepository } from '../../database/repository/report.repository.js';
import { NotificationRepository } from '../../database/repository/notification.repository.js';
import { DeviceRepository } from '../../database/repository/device.repository.js';
import { CaptureSessionRepository } from '../../database/repository/capture-session.repository.js';

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
  { name: DoctorPatient.name, schema: DoctorPatientSchema },
  { name: Appointment.name, schema: AppointmentSchema },
  { name: DoctorAvailability.name, schema: DoctorAvailabilitySchema },
  { name: Conversation.name, schema: ConversationSchema },
  { name: Message.name, schema: MessageSchema },
  { name: FundusImage.name, schema: FundusImageSchema },
  { name: Analysis.name, schema: AnalysisSchema },
  { name: DoctorReview.name, schema: DoctorReviewSchema },
  { name: Report.name, schema: ReportSchema },
  { name: Notification.name, schema: NotificationSchema },
  { name: Device.name, schema: DeviceSchema },
  { name: CaptureSession.name, schema: CaptureSessionSchema },
]);

const repositories = [
  UserRepository,
  DoctorRepository,
  PatientRepository,
  DoctorPatientRepository,
  AppointmentRepository,
  DoctorAvailabilityRepository,
  ConversationRepository,
  MessageRepository,
  FundusImageRepository,
  AnalysisRepository,
  DoctorReviewRepository,
  ReportRepository,
  NotificationRepository,
  DeviceRepository,
  CaptureSessionRepository,
];

@Global()
@Module({
  imports: [databaseConnection, models],
  providers: repositories,
  exports: [databaseConnection, models, ...repositories],
})
export class DatabaseModule {}
