import { Global, Module } from '@nestjs/common';
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
export class SchemasModule { }
