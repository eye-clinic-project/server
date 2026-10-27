export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum GenderEnum {
    MALE = "male",
    FEMALE = "female"
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

export enum DrSeverity {
  NO_DR = 0,
  MILD = 1,
  MODERATE = 2,
  SEVERE = 3,
  PROLIFERATIVE = 4,
}

export enum NotificationType {
  ANALYSIS_READY = 'analysis_ready',
  REPORT_READY = 'report_ready',
  APPOINTMENT = 'appointment',
  MESSAGE = 'message',
  DOCTOR_NOTE = 'doctor_note',
}