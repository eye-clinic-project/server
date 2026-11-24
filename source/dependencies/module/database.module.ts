import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Analysis, AnalysisSchema } from '../../database/model/analysis.model.js';
import { Appointment, AppointmentSchema } from '../../database/model/appointment.model.js';
import { Conversation, ConversationSchema } from '../../database/model/conversation.model.js';
import { Doctor, DoctorSchema } from '../../database/model/doctor.model.js';
import { DoctorAvailability, DoctorAvailabilitySchema } from '../../database/model/doctor-availability.model.js';
import { DoctorPatient, DoctorPatientSchema } from '../../database/model/doctor-patient.model.js';
import { DoctorReview, DoctorReviewSchema } from '../../database/model/doctor-review.model.js';
import { FundusImage, FundusImageSchema } from '../../database/model/fundus-image.model.js';
import { Message, MessageSchema } from '../../database/model/message.model.js';
import { Notification, NotificationSchema } from '../../database/model/notification.model.js';
import { Patient, PatientSchema } from '../../database/model/patient.model.js';
import { RefreshToken, RefreshTokenRevocation, RefreshTokenRevocationSchema, RefreshTokenSchema } from '../../database/model/refresh-token.model.js';
import { Report, ReportSchema } from '../../database/model/report.model.js';
import { User, UserSchema } from '../../database/model/user.model.js';
import { AnalysisRepository } from '../../database/repository/analysis.repository.js';
import { AppointmentRepository } from '../../database/repository/appointment.repository.js';
import { ConversationRepository } from '../../database/repository/conversation.repository.js';
import { DoctorAvailabilityRepository } from '../../database/repository/doctor-availability.repository.js';
import { DoctorPatientRepository } from '../../database/repository/doctor-patient.repository.js';
import { DoctorRepository } from '../../database/repository/doctor.repository.js';
import { DoctorReviewRepository } from '../../database/repository/doctor-review.repository.js';
import { FundusImageRepository } from '../../database/repository/fundus-image.repository.js';
import { MessageRepository } from '../../database/repository/message.repository.js';
import { NotificationRepository } from '../../database/repository/notification.repository.js';
import { PatientRepository } from '../../database/repository/patient.repository.js';
import { RefreshTokenRepository } from '../../database/repository/refresh-token.repository.js';
import { RefreshTokenRevocationRepository } from '../../database/repository/refresh-token-revocation.repository.js';
import { ReportRepository } from '../../database/repository/report.repository.js';
import { UserRepository } from '../../database/repository/user.repository.js';

const repositories = [
  UserRepository,
  AnalysisRepository,
  AppointmentRepository,
  ConversationRepository,
  DoctorAvailabilityRepository,
  DoctorPatientRepository,
  DoctorReviewRepository,
  DoctorRepository,
  FundusImageRepository,
  MessageRepository,
  NotificationRepository,
  PatientRepository,
  ReportRepository,
  RefreshTokenRepository,
  RefreshTokenRevocationRepository,
];

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: RefreshTokenRevocation.name, schema: RefreshTokenRevocationSchema },
      { name: Analysis.name, schema: AnalysisSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: DoctorAvailability.name, schema: DoctorAvailabilitySchema },
      { name: DoctorPatient.name, schema: DoctorPatientSchema },
      { name: DoctorReview.name, schema: DoctorReviewSchema },
      { name: Doctor.name, schema: DoctorSchema },
      { name: FundusImage.name, schema: FundusImageSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Patient.name, schema: PatientSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
  ],
  providers: repositories,
  exports: repositories,
})
export class DatabaseModule {}
