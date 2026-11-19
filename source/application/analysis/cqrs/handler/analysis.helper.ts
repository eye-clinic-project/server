export const USER_FIELDS = 'name email avatarUrl';

export const ANALYSIS_POPULATE = [
  { path: 'patient', select: USER_FIELDS },
  { path: 'image', select: '+storageKey' },
];

export const REPORT_POPULATE = [
  { path: 'doctor', select: USER_FIELDS },
  { path: 'patient', select: USER_FIELDS },
];
