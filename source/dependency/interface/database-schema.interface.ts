import type { Types } from 'mongoose';
import type {
  AuthProviderEnum,
  SystemRoleEnum,
} from '../enum/security.enum.js';
import type {
  AnalysisStatus,
  AppointmentStatus,
  AssignmentStatus,
  CaptureSessionStatus,
  DRLevel,
  DeviceStatus,
  DiabetesType,
  EyeSide,
  ImageSource,
  NotificationType,
  ReportStatus,
} from '../enum/database.enum.js';

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
  avatarKey?: string;
  avatarUrl?: string;
  provider?: AuthProviderEnum;
  googleId?: string;
  emailVerifiedAt?: Date | null;
  consentAcceptedAt?: Date | null;
  isActive?: boolean;
  lang?: string;
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
}

export interface IPatient extends Timestamps {
  _id?: Types.ObjectId;
  user: Types.ObjectId;
  medicalRecordNumber: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female';
  emergencyContact?: string;
  diabetesType?: DiabetesType;
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
  device?: Types.ObjectId | null;
  captureSession?: Types.ObjectId | null;
}

export interface IAnalysisHistoryEntry {
  status: AnalysisStatus;
  message?: string;
  at: Date;
  by?: Types.ObjectId | null;
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
  gradCamKey?: string | null;
  modelVersion?: string | null;
  isMock?: boolean;
  error?: string | null;
  attempts: number;
  processingMs?: number | null;
  completedAt?: Date | null;
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
}

export interface IDevice extends Timestamps {
  _id?: Types.ObjectId;
  name: string;
  serialNumber: string;
  model?: string;
  location?: string;
  owner: Types.ObjectId;
  apiKeyHash: string;
  apiKeyPrefix: string;
  status: DeviceStatus;
  lastSeenAt?: Date | null;
}

export interface ICaptureSession extends Timestamps {
  _id?: Types.ObjectId;
  device: Types.ObjectId;
  doctor: Types.ObjectId;
  patient: Types.ObjectId;
  eye: EyeSide;
  status: CaptureSessionStatus;
  image?: Types.ObjectId | null;
  analysis?: Types.ObjectId | null;
  autoAnalyze: boolean;
  error?: string | null;
  expiresAt: Date;
}
