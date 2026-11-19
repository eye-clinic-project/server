export enum TokenEnum {
  ACCESS = 'access',
  REFRESH = 'refresh',
}
export enum LogoutEnum {
  ONLY,
  ALL,
}

export enum SystemRoleEnum {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
}

export enum SignUpRoleEnum {
  DOCTOR = 'doctor',
  PATIENT = 'patient',
}

export enum ProviderEnum {
  SYSTEM,
  GOOGLE,
}

export enum AuthProviderEnum {
  SYSTEM = 'system',
  GOOGLE = 'google',
}

export enum LogoutTypeEnum {
  SINGLE = 'single',
  ALL = 'all',
}

export enum OtpPurpose {
  EMAIL_VERIFICATION = 'email-verification',
  PASSWORD_RESET = 'password-reset',
}
