import type { Types } from 'mongoose';
import type {
  AnalysisStatus,
  AppointmentRequestStatus,
  AppointmentRequestType,
  AppointmentStatus,
  AssignmentStatus,
  DevicePlatform,
  DoctorVerificationStatus,
  DRLevel,
  EyeSide,
  ImageSource,
  NotificationType,
  ReportStatus,
  RescheduleReason,
  AuthProviderEnum,
  SystemRoleEnum,
} from '../enum/index.js';

export type WithId<T> = T & { _id: Types.ObjectId };

interface Timestamps {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser extends Timestamps {
  _id?: Types.ObjectId;
  role: SystemRoleEnum;
  name: string;
  email: string;
  passwordHash?: string;
  city: string;
  phone?: string;
  avatarUrl?: string;
  provider?: AuthProviderEnum;
  googleId?: string;
  emailVerifiedAt?: Date | null;
  consentAcceptedAt?: Date | null;
  isActive?: boolean;
  language?: string | null;
  doctorStatus?: DoctorVerificationStatus | null;
}

export interface ILicenseDocument {
  key: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface IDoctor extends Timestamps {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  clinicName: string;
  clinicAddress: string;
  specialty?: string;
  licenseNumber?: string;
  bio?: string;
  yearsOfExperience?: number;
  verificationStatus?: DoctorVerificationStatus;
  verificationSubmittedAt?: Date | null;
  verifiedAt?: Date | null;
  verifiedBy?: Types.ObjectId | null;
  rejectionReason?: string | null;
  licenseDocuments?: ILicenseDocument[];
}

export interface IPatient extends Timestamps {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  medicalRecordNumber: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female';
  emergencyContact?: string;
  diabetesSince?: number;
  medicalNotes?: string;
  createdBy?: Types.ObjectId;
}

export interface IDoctorPatient extends Timestamps {
  _id?: Types.ObjectId;
  doctor: Types.ObjectId;
  patient: Types.ObjectId;
  status: AssignmentStatus;
  assignedAt?: Date;
  assignedBy?: Types.ObjectId;
  endedAt?: Date | null;
  notes?: string;
}

export interface IDoctorAvailability extends Timestamps {
  _id?: Types.ObjectId;
  doctor: Types.ObjectId;
  startAt: Date;
  endAt: Date;
  isBooked: boolean;
  appointment?: Types.ObjectId | null;
}

export interface IRescheduleEntry {
  from: Date;
  to: Date;
  reason: RescheduleReason;
  note?: string;
  by: Types.ObjectId;
  byRole: SystemRoleEnum;
  at: Date;
}

export interface IAppointmentChangeRequest {
  type: AppointmentRequestType;
  status: AppointmentRequestStatus;
  reason: string;
  rescheduleReason?: RescheduleReason;
  slot?: Types.ObjectId | null;
  scheduledAt?: Date | null;
  endAt?: Date | null;
  requestedBy: Types.ObjectId;
  requestedAt: Date;
  decidedBy?: Types.ObjectId | null;
  decidedAt?: Date | null;
  decisionNote?: string | null;
}

export interface IAppointment extends Timestamps {
  _id?: Types.ObjectId;
  doctor: Types.ObjectId;
  patient: Types.ObjectId;
  slot?: Types.ObjectId | null;
  scheduledAt: Date;
  endAt?: Date;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  cancelledBy?: Types.ObjectId | null;
  cancelReason?: string;
  rescheduleHistory?: IRescheduleEntry[];
  changeRequest?: IAppointmentChangeRequest | null;
}

export interface IFundusImage extends Timestamps {
  _id?: Types.ObjectId;
  patient: Types.ObjectId;
  uploadedBy: Types.ObjectId;
  eye: EyeSide;
  source: ImageSource;
  storageKey: string;
  mimeType: string;
  size: number;
  sha256: string;
  originalName?: string;
  notes?: string;
  capturedAt?: Date;
}

export interface IAnalysisHistoryEntry {
  status: AnalysisStatus;
  message?: string;
  at: Date;
  by?: Types.ObjectId | null;
}

export interface IAnalysisFinding {
  code: string;
  name: string;
  probability: number;
  threshold: number;
  detected: boolean;
}

export interface IAnalysis extends Timestamps {
  _id?: Types.ObjectId;
  doctor: Types.ObjectId;
  patient: Types.ObjectId;
  image: Types.ObjectId;
  status: AnalysisStatus;
  hasDR?: boolean | null;
  stage1Confidence?: number | null;
  predictedLevel?: DRLevel | null;
  confidence?: number | null;
  probabilities?: number[];
  findings?: IAnalysisFinding[];
  gradCamKey?: string | null;
  modelVersion?: string | null;
  isMock?: boolean;
  error?: string | null;
  attempts: number;
  processingMs?: number | null;
  completedAt?: Date | null;
  reviewedAt?: Date | null;
  history: IAnalysisHistoryEntry[];
}

export interface IDoctorReview extends Timestamps {
  _id?: Types.ObjectId;
  analysis: Types.ObjectId;
  doctor: Types.ObjectId;
  patient: Types.ObjectId;
  aiResultConfirmed: boolean;
  confirmedLevel: DRLevel;
  notes?: string;
  recommendations?: string;
  followUpDate?: Date | null;
}

export interface IConversation extends Timestamps {
  _id?: Types.ObjectId;
  participants: Types.ObjectId[];
  doctor: Types.ObjectId;
  patient: Types.ObjectId;
  lastMessage?: Types.ObjectId | null;
  lastMessageAt?: Date | null;
}

export interface IMessage extends Timestamps {
  _id?: Types.ObjectId;
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  message: string;
  attachments: string[];
  deliveredTo: Types.ObjectId[];
  readBy: Types.ObjectId[];
  editedAt?: Date | null;
  deletedAt?: Date | null;
}

export interface INotification extends Timestamps {
  _id?: Types.ObjectId;
  recipient: Types.ObjectId;
  title: string;
  body: string;
  read: boolean;
  readAt?: Date | null;
  type: NotificationType;
  link?: string;
  resourceId?: Types.ObjectId | null;
  emailedAt?: Date | null;
  pushedAt?: Date | null;
}

export interface IDeviceToken extends Timestamps {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  token: string;
  platform: DevicePlatform;
  lastSeenAt: Date;
}

export interface IReport extends Timestamps {
  _id?: Types.ObjectId;
  doctor: Types.ObjectId;
  patient: Types.ObjectId;
  analysis: Types.ObjectId;
  review?: Types.ObjectId | null;
  title: string;
  content?: string;
  recommendations?: string;
  status: ReportStatus;
  sentAt?: Date | null;
  viewedAt?: Date | null;
  pdfKey?: string | null;
  pdfSize?: number | null;
}

export interface IRefreshToken {
  _id: string;
  familyId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  familyExpiresAt: Date;
  usedAt?: Date | null;
  claims?: Record<string, unknown> | null;
}

export interface IRefreshTokenRevocation {
  _id: string;
  revokedAt: Date;
  familyExpiresAt: Date;
}
