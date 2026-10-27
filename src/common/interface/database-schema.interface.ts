import type { Types } from 'mongoose';
import type { UserRoleEnum } from '../enum/security.enum.js';
import { AppointmentStatus, DRLevel } from '../enum/schema.enum.js';

// ==================== User ====================

export interface IUser {
  _id?: Types.ObjectId;
  role: UserRoleEnum;
  name: string;
  email: string;
  passwordHash: string;
  city: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== Doctor ====================

export interface IDoctor {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  clinicName: string;
  clinicAddress: string;
  specialty?: string;
  licenseNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== Patient  ====================

export interface IPatient {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  dateOfBirth?: Date;
  gender?: 'male' | 'female';
  emergencyContact?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== Doctor Patient ====================

export interface IDoctorPatient {
  _id?: Types.ObjectId;
  doctor: Types.ObjectId;
  patient: Types.ObjectId;
  assignedAt?: Date;
  assignedBy?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== Appointment ====================

export interface IAppointment {
  _id?: Types.ObjectId;
  doctor: Types.ObjectId;
  patient: Types.ObjectId;
  scheduledAt: Date;
  status: AppointmentStatus;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== Fundus Image ====================

export interface IFundusImage {
  _id?: Types.ObjectId;
  patient: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  imageUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== Diabetic Retinopathy Analysis ====================

export interface IAnalysis {
  _id?: Types.ObjectId;
  doctor: Types.ObjectId;
  patient: Types.ObjectId;
  image: Types.ObjectId;
  predictedLevel: DRLevel;
  confidence?: number;
  gradCamUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== Conversation ====================

export interface IConversation {
  _id?: Types.ObjectId;
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== Message ====================

export interface IMessage {
  _id?: Types.ObjectId;
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  message: string;
  attachments: string[];
  readBy: Types.ObjectId[];
  editedAt?: Date;
  deletedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== Notification ====================

export interface INotification {
  _id?: Types.ObjectId;
  recipient: Types.ObjectId;
  title: string;
  body: string;
  read: boolean;
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== Report ====================

export interface IReport {
  _id?: Types.ObjectId;
  doctor: Types.ObjectId;
  patient: Types.ObjectId;
  analysis: Types.ObjectId;
  title: string;
  content?: string;
  fileUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
