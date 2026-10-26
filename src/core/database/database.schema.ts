import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './model/user.model.js';
import { Doctor, DoctorSchema } from './model/doctor.model.js';
import { Patient, PatientSchema } from './model/patient.model.js';
import { Appointment, AppointmentSchema } from './model/appointment.model.js';
import { Conversation, ConversationSchema } from './model/conversation.model.js';
import { Message, MessageSchema } from './model/message.model.js';
import { Analysis, AnalysisSchema } from './model/analysis.model.js';
import { Report, ReportSchema } from './model/report.model.js';
import { Notification, NotificationSchema } from './model/notification.model.js';
 
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
@Module({ imports: [models], exports: [models] })
export class SchemasModule {}