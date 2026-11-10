export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum GenderEnum {
  MALE = 'male',
  FEMALE = 'female',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum DRLevel {
  NO_DR = 0,
  MILD = 1,
  MODERATE = 2,
  SEVERE = 3,
  PROLIFERATIVE = 4,
}

/** @deprecated use DRLevel */
export const DrSeverity = DRLevel;

export const DR_LEVEL_LABELS: Record<DRLevel, string> = {
  [DRLevel.NO_DR]: 'No DR',
  [DRLevel.MILD]: 'Mild',
  [DRLevel.MODERATE]: 'Moderate',
  [DRLevel.SEVERE]: 'Severe',
  [DRLevel.PROLIFERATIVE]: 'Proliferative DR',
};

/** Plain-language explanation shown next to each grade (NFR14). */
export const DR_LEVEL_DESCRIPTIONS: Record<DRLevel, string> = {
  [DRLevel.NO_DR]: 'No signs of diabetic retinopathy were detected.',
  [DRLevel.MILD]: 'Early, small changes in the retinal blood vessels. Usually monitored with regular check-ups.',
  [DRLevel.MODERATE]: 'More blood vessels are affected. Referral to an eye specialist is recommended.',
  [DRLevel.SEVERE]: 'Many blood vessels are blocked. Prompt specialist assessment is needed.',
  [DRLevel.PROLIFERATIVE]: 'Advanced stage with new abnormal blood vessels. Urgent specialist treatment is needed.',
};

export const DR_LEVEL_VALUES = [0, 1, 2, 3, 4] as const;

export enum EyeSide {
  LEFT = 'left',
  RIGHT = 'right',
  UNKNOWN = 'unknown',
}

export enum ImageSource {
  UPLOAD = 'upload',
}

export enum NotificationType {
  APPOINTMENT = 'appointment',
  ANALYSIS = 'analysis',
  REPORT = 'report',
  MESSAGE = 'message',
  SYSTEM = 'system',
  NOTE = 'note',
  FOLLOW_UP = 'follow_up',
}

export enum ReportStatus {
  DRAFT = 'draft',
  SENT = 'sent',
}

export enum AssignmentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ENDED = 'ended',
}

/** Admin review of a doctor's medical license. Only approved doctors can use doctor features. */
export enum DoctorVerificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum DiabetesType {
  TYPE_1 = 'type1',
  TYPE_2 = 'type2',
  GESTATIONAL = 'gestational',
  OTHER = 'other',
}
