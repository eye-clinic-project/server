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

/** Roles a user may pick for themselves at sign-up (admins are created by admins). */
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
