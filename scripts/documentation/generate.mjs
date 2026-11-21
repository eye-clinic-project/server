import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..', '..');
const OUT = join(ROOT, 'public', 'documentation');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const BASE_URL = 'http://localhost:9090';
const YEAR = new Date().getFullYear();

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const str = (extra = {}) => ({ type: 'string', ...extra });
const text = (maxLength, extra = {}) => str({ maxLength, ...extra });
const int = (extra = {}) => ({ type: 'integer', ...extra });
const num = (extra = {}) => ({ type: 'number', ...extra });
const bool = (extra = {}) => ({ type: 'boolean', ...extra });
const date = (extra = {}) => str({ format: 'date-time', ...extra });
const oid = (description) => str({ pattern: '^[a-f0-9]{24}$', example: '665f1c2e9b1e8a0012ab34cd', ...(description && { description }) });
const oneOf = (values, extra = {}) => str({ enum: values, ...extra });
const arr = (items, extra = {}) => ({ type: 'array', items, ...extra });
const nullable = (schema) => ('$ref' in schema ? { allOf: [schema], nullable: true } : { ...schema, nullable: true });
const obj = (properties, required = [], extra = {}) => ({ type: 'object', properties, ...(required.length && { required }), ...extra });
const pageOf = (item, extra = {}) =>
  obj({ docs: arr(item), count: int({ example: 1 }), ...extra, currentPage: int({ example: 1 }), size: int({ example: 20 }), pages: int({ example: 1 }) }, ['docs', 'count', 'currentPage', 'size', 'pages']);

const ROLES = ['admin', 'doctor', 'patient'];
const APPOINTMENT_STATUS = ['pending', 'confirmed', 'cancelled', 'completed'];
const REQUEST_TYPES = ['cancel', 'reschedule'];
const REQUEST_STATUS = ['pending', 'approved', 'rejected', 'withdrawn'];
const RESCHEDULE_REASONS = ['patient_request', 'patient_emergency', 'doctor_unavailable', 'medical_follow_up', 'other'];
const ANALYSIS_STATUS = ['pending', 'processing', 'completed', 'failed'];
const NOTIFICATION_TYPES = ['appointment', 'analysis', 'report', 'message', 'system', 'note', 'follow_up'];
const DR_LEVELS = [0, 1, 2, 3, 4];
const DR_LEVEL_TEXT = '0 No DR · 1 Mild · 2 Moderate · 3 Severe · 4 Proliferative DR';
const PHONE = '^\\+?[0-9\\s-]{7,20}$';

const patientProfile = {
  phone: str({ pattern: PHONE, example: '+20 100 123 4567' }),
  dateOfBirth: date({ description: 'Not in the future', example: '1970-05-01T00:00:00.000Z' }),
  gender: oneOf(['male', 'female']),
  emergencyContact: text(200, { example: 'Mona Hassan +20 100 765 4321' }),
  diabetesSince: int({ minimum: 1900, maximum: YEAR, example: 2012 }),
  medicalNotes: text(5000, { example: 'Type 2 diabetes, on metformin.' }),
};

const schemas = {
  ErrorResponse: obj(
    {
      statusCode: int({ example: 400 }),
      message: { oneOf: [str(), arr(str())], description: 'Translated to the request language. Validation errors return one message per failed rule.', example: ['email must be an email'] },
      error: str({ example: 'Bad Request' }),
      errorCode: str({ description: 'Present on authentication errors', example: 'missing_credentials' }),
    },
    ['statusCode', 'message'],
  ),
  Message: obj({ message: str({ example: 'Request completed successfully' }) }, ['message']),
  TokenPair: obj({ accessToken: str({ example: 'eyJhbGciOiJIUzI1NiIs…' }), expiresIn: int({ description: 'Seconds until the access token expires', example: 900 }), refreshToken: str({ description: 'Single use: /authentication/refresh exchanges it for a new pair' }) }, ['accessToken', 'expiresIn', 'refreshToken']),
  AuthUser: obj({
    _id: oid(),
    role: oneOf(ROLES),
    name: str({ example: 'Ahmed Hassan' }),
    email: str({ format: 'email', example: 'ahmed@example.com' }),
    city: str({ example: 'Cairo' }),
    phone: str(),
    avatarUrl: str(),
    provider: oneOf(['system', 'google']),
    emailVerifiedAt: nullable(date()),
    consentAcceptedAt: nullable(date()),
    isActive: bool(),
    createdAt: date(),
    updatedAt: date(),
  }),
  User: obj({
    _id: oid(),
    role: oneOf(ROLES),
    name: str({ example: 'Ahmed Hassan' }),
    email: str({ format: 'email' }),
    city: str({ example: 'Cairo' }),
    phone: str(),
    avatarUrl: nullable(str({ format: 'uri' })),
    provider: oneOf(['system', 'google']),
    emailVerified: bool(),
    language: nullable(oneOf(['en', 'ar'])),
    createdAt: date(),
    updatedAt: date(),
  }),
  PatientAccount: obj({ _id: oid(), name: str(), email: str({ format: 'email' }), city: str(), phone: str(), avatarUrl: nullable(str()), emailVerified: bool(), isActive: bool() }),
  Patient: obj({
    _id: oid('Patient profile id (used in /patient/{id} and /doctor/patients/{id})'),
    medicalRecordNumber: str({ example: 'RC-261117-4F2A9C' }),
    user: ref('PatientAccount'),
    dateOfBirth: nullable(date()),
    gender: nullable(oneOf(['male', 'female'])),
    emergencyContact: nullable(str()),
    diabetesSince: nullable(int()),
    medicalNotes: nullable(str()),
    createdBy: nullable(oid()),
    createdAt: date(),
    updatedAt: date(),
  }),
  AssignedDoctor: obj({
    assignmentId: oid(),
    assignedAt: nullable(date()),
    _id: oid('Doctor user id (used as {doctorId} when listing free slots)'),
    name: str(),
    email: str({ format: 'email' }),
    city: str(),
    phone: nullable(str()),
    avatarUrl: nullable(str()),
    clinicName: nullable(str()),
    clinicAddress: nullable(str()),
    specialty: nullable(str()),
    bio: nullable(str()),
    yearsOfExperience: nullable(int()),
    verificationStatus: nullable(oneOf(['pending', 'approved', 'rejected'])),
  }),
  DoctorClinic: obj({
    _id: oid(),
    user: oid(),
    clinicName: str({ example: 'Nile Eye Clinic' }),
    clinicAddress: str({ example: '12 Tahrir St, Cairo' }),
    specialty: nullable(str({ example: 'Ophthalmology' })),
    licenseNumber: nullable(str()),
    bio: nullable(str()),
    yearsOfExperience: nullable(int()),
    verificationStatus: nullable(oneOf(['pending', 'approved', 'rejected'])),
    createdAt: date(),
    updatedAt: date(),
  }),
  LicenseDocument: obj({ index: int({ example: 0 }), originalName: str({ example: 'license.pdf' }), mimeType: oneOf(['application/pdf', 'image/jpeg', 'image/png']), size: int({ example: 184320 }), uploadedAt: date() }),
  DoctorVerification: obj({
    status: nullable(oneOf(['pending', 'approved', 'rejected'])),
    licenseNumber: nullable(str({ example: 'EG-OPH-20431' })),
    submittedAt: nullable(date({ description: 'When the license documents were last submitted; null until they are' })),
    verifiedAt: nullable(date()),
    rejectionReason: nullable(str()),
    documents: arr(ref('LicenseDocument')),
  }),
  AdminDoctor: obj({
    _id: oid('Doctor profile id'),
    userId: oid(),
    name: str({ example: 'Sara Mahmoud' }),
    email: str({ format: 'email' }),
    city: str({ example: 'Cairo' }),
    phone: nullable(str()),
    avatarUrl: nullable(str()),
    isActive: bool(),
    emailVerified: bool(),
    clinicName: str({ example: 'Nile Eye Clinic' }),
    clinicAddress: str({ example: '12 Tahrir St, Cairo' }),
    specialty: nullable(str()),
    licenseNumber: nullable(str({ example: 'EG-OPH-20431' })),
    yearsOfExperience: nullable(int()),
    status: nullable(oneOf(['pending', 'approved', 'rejected'])),
    submittedAt: nullable(date()),
    verifiedAt: nullable(date()),
    verifiedBy: nullable(oid('Admin who made the last decision')),
    rejectionReason: nullable(str()),
    documents: arr(ref('LicenseDocument')),
    createdAt: date(),
  }),
  UserStatus: obj({ _id: oid(), isActive: bool() }),
  PatientSearchResult: obj({
    _id: oid('Patient profile id'),
    medicalRecordNumber: str(),
    user: obj({ _id: oid(), name: str(), email: str(), city: str(), avatarUrl: nullable(str()) }),
    assigned: bool({ description: 'Already assigned to the calling doctor' }),
  }),
  Slot: obj({ _id: oid(), doctor: oid(), startAt: date(), endAt: date(), isBooked: bool(), appointment: nullable(oid()) }),
  Participant: obj({ _id: oid(), name: str(), email: str(), avatarUrl: nullable(str()) }),
  AppointmentChangeRequest: obj({
    type: oneOf(REQUEST_TYPES),
    status: oneOf(REQUEST_STATUS),
    reason: str(),
    rescheduleReason: oneOf(RESCHEDULE_REASONS),
    slot: nullable(oid('Slot held for a reschedule request')),
    scheduledAt: nullable(date()),
    endAt: nullable(date()),
    requestedBy: oid(),
    requestedAt: date(),
    decidedBy: nullable(oid()),
    decidedAt: nullable(date()),
    decisionNote: nullable(str()),
  }),
  RescheduleEntry: obj({ from: date(), to: date(), reason: oneOf(RESCHEDULE_REASONS), note: str(), by: oid(), byRole: oneOf(ROLES), at: date() }),
  Appointment: obj({
    _id: oid(),
    doctor: nullable(ref('Participant')),
    patient: nullable(ref('Participant')),
    slot: nullable(oid()),
    scheduledAt: date(),
    endAt: nullable(date()),
    status: oneOf(APPOINTMENT_STATUS),
    reason: nullable(str()),
    cancelledBy: nullable(oid()),
    cancelReason: nullable(str()),
    changeRequest: nullable(ref('AppointmentChangeRequest')),
    rescheduleHistory: arr(ref('RescheduleEntry')),
    createdAt: date(),
    updatedAt: date(),
  }),
  ChatParticipant: obj({ _id: oid(), name: str(), avatarUrl: nullable(str()), role: oneOf(ROLES) }),
  ChatAttachment: obj({ index: int(), url: str({ description: 'GET it with the bearer token', example: '/chat/attachments/665f1c2e9b1e8a0012ab34cd/0' }), contentType: oneOf(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']), isImage: bool() }),
  ChatMessage: obj({ _id: oid(), conversation: oid(), sender: oid(), message: str(), attachments: arr(ref('ChatAttachment')), readBy: arr(oid()), createdAt: date(), clientId: str({ description: 'Echo of the clientId sent with send_message' }) }),
  Conversation: obj({ _id: oid(), doctor: ref('ChatParticipant'), patient: ref('ChatParticipant'), lastMessage: nullable(ref('ChatMessage')), lastMessageAt: nullable(date()), unreadCount: int() }),
  MessagePage: obj({ docs: arr(ref('ChatMessage')), nextBefore: nullable(date({ description: 'Pass as ?before= to load older messages; null when there are none' })) }),
  Notification: obj({ _id: oid(), type: oneOf(NOTIFICATION_TYPES), title: str(), body: str(), link: nullable(str({ example: '/analysis/665f1c2e9b1e8a0012ab34cd' })), resourceId: nullable(oid()), read: bool(), readAt: nullable(date()), createdAt: date() }),
  UserRef: obj({ _id: oid(), name: str(), email: str(), avatarUrl: nullable(str()) }),
  AnalysisFinding: obj({ code: oneOf(['N', 'D', 'G', 'C', 'A', 'H', 'M', 'O']), name: str({ example: 'Diabetic Retinopathy' }), probability: num({ minimum: 0, maximum: 1, example: 0.712 }), threshold: num({ minimum: 0, maximum: 1, example: 0.575 }), detected: bool() }),
  AnalysisHistoryEntry: obj({ status: oneOf(ANALYSIS_STATUS), message: str({ example: 'Sent to AI service' }), at: date(), by: nullable(oid()) }),
  Analysis: obj({
    _id: oid(),
    doctor: oid(),
    patient: nullable(ref('UserRef')),
    image: nullable(obj({ _id: oid(), eye: oneOf(['left', 'right', 'unknown']), originalName: nullable(str()), notes: nullable(str()), capturedAt: nullable(date()), mimeType: oneOf(['image/jpeg', 'image/png']), size: int() })),
    status: oneOf(ANALYSIS_STATUS),
    stage1: obj(
      {
        hasDR: nullable(bool()),
        confidence: nullable(num({ minimum: 0, maximum: 1, description: 'Confidence in the yes/no decision' })),
        drProbability: nullable(num({ minimum: 0, maximum: 1, example: 0.83, description: 'Ensemble probability of the D class' })),
        threshold: nullable(num({ minimum: 0, maximum: 1, example: 0.575, description: 'Threshold drProbability was compared against' })),
        status: nullable(oneOf(['DETECTED', 'SUSPECTED'], { description: 'DETECTED when any class passed its threshold; SUSPECTED otherwise' })),
        detected: arr(str({ example: 'D' }), { description: 'Codes of the findings that passed their threshold' }),
        shown: arr(str({ example: 'D' }), { description: 'Codes to display: the detected ones, or the top suspected ones' }),
        top: nullable(str({ example: 'D', description: 'Highest-probability finding code' })),
        gradCamClass: nullable(str({ example: 'D', description: 'Finding code the Grad-CAM heatmap explains' })),
        findings: arr(ref('AnalysisFinding')),
      },
      [],
      { description: 'Stage 1: is diabetic retinopathy present (multi-label EfficientNet ensemble, 8 classes)' },
    ),
    stage2: obj(
      {
        available: bool({ description: 'false until the grading model is deployed' }),
        predictedLevel: nullable(int({ enum: DR_LEVELS, description: DR_LEVEL_TEXT })),
        label: nullable(str({ example: 'Moderate' })),
        confidence: nullable(num()),
        probabilities: arr(num()),
      },
      [],
      { description: 'Stage 2: DR severity level' },
    ),
    hasGradCam: bool(),
    modelVersion: nullable(str({ example: 'effnet-b5-stage1-ens3' })),
    isMock: bool(),
    error: nullable(str({ description: 'Why the analysis failed (translated)' })),
    attempts: int(),
    processingMs: nullable(int()),
    completedAt: nullable(date()),
    reviewedAt: nullable(date()),
    history: arr(ref('AnalysisHistoryEntry')),
    createdAt: date(),
    updatedAt: date(),
  }),
  Review: obj({
    _id: oid(),
    analysis: oid(),
    doctor: oid(),
    patient: oid(),
    aiResultConfirmed: bool(),
    confirmedLevel: int({ enum: DR_LEVELS, description: DR_LEVEL_TEXT }),
    confirmedLabel: str({ example: 'Moderate' }),
    notes: nullable(str()),
    recommendations: nullable(str()),
    followUpDate: nullable(date()),
    createdAt: date(),
    updatedAt: date(),
  }),
  Report: obj({
    _id: oid(),
    doctor: nullable(ref('UserRef')),
    patient: nullable(ref('UserRef')),
    analysis: oid(),
    review: nullable(oid()),
    title: str({ example: 'Retina screening report' }),
    content: nullable(str()),
    recommendations: nullable(str()),
    status: oneOf(['draft', 'sent']),
    sentAt: nullable(date()),
    viewedAt: nullable(date({ description: 'Set the first time the patient downloads it' })),
    hasPdf: bool(),
    pdfSize: nullable(int()),
    createdAt: date(),
    updatedAt: date(),
  }),
  AiHealth: obj({ mode: oneOf(['remote', 'mock', 'disabled']), available: bool(), modelVersion: nullable(str()), error: nullable(str()), info: obj({}, [], { description: 'The AI service /model-info response', additionalProperties: true }) }),

  SignUpDto: obj(
    {
      name: text(100),
      email: str({ format: 'email', maxLength: 254 }),
      password: str({ minLength: 8, maxLength: 72 }),
      city: text(100),
      role: oneOf(['patient', 'doctor'], { default: 'patient' }),
      acceptTerms: bool(),
      clinicName: text(150, { description: 'Required for doctors' }),
      clinicAddress: text(300, { description: 'Required for doctors' }),
      specialty: text(100),
      licenseNumber: text(50, { description: 'Required for doctors' }),
    },
    ['name', 'email', 'password', 'city'],
    { example: { name: 'Sara Mahmoud', email: 'sara@example.com', password: 'Str0ng-Passw0rd', city: 'Cairo', role: 'doctor', acceptTerms: true, clinicName: 'Nile Eye Clinic', clinicAddress: '12 Tahrir St, Cairo', specialty: 'Ophthalmology', licenseNumber: 'EG-12345' } },
  ),
  SignInDto: obj({ email: str({ format: 'email' }), password: str({ maxLength: 72 }) }, ['email', 'password'], { example: { email: 'sara@example.com', password: 'Str0ng-Passw0rd' } }),
  RefreshTokenDto: obj({ refreshToken: text(512) }, ['refreshToken'], { example: { refreshToken: 'k3F9xQ2mW7rT5vY8zB1nC4dE6gH0jL' } }),
  LogoutDto: obj(
    { type: oneOf(['single', 'all'], { description: 'single: this session; all: every session and every registered device' }), refreshToken: text(512, { description: 'Required when type is single' }), deviceToken: text(4096, { description: 'FCM token to stop pushing to' }) },
    ['type'],
    { example: { type: 'single', refreshToken: 'k3F9xQ2mW7rT5vY8zB1nC4dE6gH0jL' } },
  ),
  EmailDto: obj({ email: str({ format: 'email' }) }, ['email'], { example: { email: 'sara@example.com' } }),
  VerifyEmailDto: obj({ email: str({ format: 'email' }), code: str({ pattern: '^\\d{6}$' }) }, ['email', 'code'], { example: { email: 'sara@example.com', code: '123456' } }),
  ResetPasswordDto: obj({ email: str({ format: 'email' }), code: str({ pattern: '^\\d{6}$' }), password: str({ minLength: 8, maxLength: 72 }) }, ['email', 'code', 'password'], { example: { email: 'sara@example.com', code: '123456', password: 'N3w-Passw0rd' } }),
  GoogleSignInDto: obj({ idToken: text(4096, { description: 'Google ID token from the client SDK' }), city: text(100, { description: 'Used when the account is created' }) }, ['idToken'], { example: { idToken: '<google-id-token>', city: 'Cairo' } }),
  UpdateUserDto: obj({ name: text(100), city: text(100), language: oneOf(['en', 'ar'], { description: 'Language for push notifications and stored notification text' }) }, [], { example: { name: 'Sara Mahmoud', city: 'Giza', language: 'ar' } }),
  RegisterDeviceDto: obj({ token: text(4096, { description: 'FCM registration token' }), platform: oneOf(['android', 'ios', 'web']) }, ['token', 'platform'], { example: { token: '<fcm-token>', platform: 'android' } }),
  DeviceTokenDto: obj({ token: text(4096) }, ['token'], { example: { token: '<fcm-token>' } }),
  CreatePatientDto: obj({ name: text(100), email: str({ format: 'email', maxLength: 254 }), city: text(100), ...patientProfile }, ['name', 'email', 'city'], {
    example: { name: 'Ahmed Hassan', email: 'ahmed@example.com', city: 'Cairo', phone: '+20 100 123 4567', dateOfBirth: '1970-05-01', gender: 'male', diabetesSince: 2012 },
  }),
  UpdatePatientDto: obj({ name: text(100), city: text(100), ...patientProfile }, [], { example: { phone: '+20 100 123 4567', medicalNotes: 'HbA1c 7.9% (Nov 2026)' } }),
  UpdateClinicDto: obj(
    { clinicName: text(150, { description: 'Required when the clinic profile does not exist yet' }), clinicAddress: text(300, { description: 'Required when the clinic profile does not exist yet' }), specialty: text(100), bio: text(2000), yearsOfExperience: int({ minimum: 0, maximum: 80 }) },
    [],
    { example: { clinicName: 'Nile Eye Clinic', clinicAddress: '12 Tahrir St, Cairo', specialty: 'Ophthalmology', yearsOfExperience: 12 } },
  ),
  CreateAvailabilityDto: obj(
    { startAt: date(), endAt: date(), slotMinutes: int({ minimum: 5, maximum: 240 }), breakMinutes: int({ minimum: 0, maximum: 120, default: 0 }) },
    ['startAt', 'endAt', 'slotMinutes'],
    { description: 'Splits the interval into slots of slotMinutes with breakMinutes between them (at most 100 slots, no overlap with existing slots).', example: { startAt: '2026-11-20T08:00:00.000Z', endAt: '2026-11-20T12:00:00.000Z', slotMinutes: 20, breakMinutes: 5 } },
  ),
  BookAppointmentDto: obj({ slotId: oid(), reason: text(500) }, ['slotId'], { example: { slotId: '665f1c2e9b1e8a0012ab34cd', reason: 'Annual diabetic eye check' } }),
  CancelRequestDto: obj({ reason: str({ minLength: 3, maxLength: 500 }) }, ['reason'], { example: { reason: 'I will be travelling that week' } }),
  RescheduleRequestDto: obj(
    { slotId: oid('The new slot; it is held until the doctor decides'), reason: oneOf(RESCHEDULE_REASONS.filter((reason) => reason !== 'doctor_unavailable')), note: text(500, { description: 'Required when reason is other' }) },
    ['slotId', 'reason'],
    { example: { slotId: '665f1c2e9b1e8a0012ab34cd', reason: 'patient_request', note: 'Exam at work that morning' } },
  ),
  DecideRequestDto: obj({ note: text(500) }, [], { example: { note: 'Approved, see you then' } }),
  StartConversationDto: obj({ participantId: oid('User id of the other participant (an assigned doctor or patient)') }, ['participantId'], { example: { participantId: '665f1c2e9b1e8a0012ab34cd' } }),
  CreateAnalysisForm: obj(
    {
      image: str({ format: 'binary', description: 'Fundus photo, JPEG or PNG, at most 10 MB (type is detected from the bytes)' }),
      patientId: oid('Patient profile id; the patient must be assigned to you'),
      eye: oneOf(['left', 'right', 'unknown']),
      notes: text(1000),
      capturedAt: date({ description: 'Not in the future' }),
    },
    ['image', 'patientId'],
  ),
  SubmitLicenseForm: obj(
    {
      licenseNumber: text(50, { example: 'EG-OPH-20431' }),
      documents: arr(str({ format: 'binary' }), { minItems: 1, maxItems: 3, description: '1 to 3 files: PDF, JPEG or PNG, at most 10 MB each (type is detected from the bytes)' }),
    },
    ['licenseNumber', 'documents'],
  ),
  RejectDoctorDto: obj({ reason: text(500) }, ['reason'], { example: { reason: 'The license number does not match the uploaded document' } }),
  UpdateUserStatusDto: obj({ isActive: bool() }, ['isActive'], { example: { isActive: false } }),
  AvatarForm: obj({ avatar: str({ format: 'binary', description: 'JPEG, PNG or WEBP, at most 5 MB' }) }, ['avatar']),
  CreateReviewDto: obj(
    {
      aiResultConfirmed: bool({ description: 'Whether you agree with the AI result' }),
      confirmedLevel: int({ enum: DR_LEVELS, description: DR_LEVEL_TEXT }),
      notes: text(5000, { description: 'A note here (or report content) is required before a report can be generated' }),
      recommendations: text(5000),
      followUpDate: date({ description: 'Must be in the future' }),
    },
    ['aiResultConfirmed', 'confirmedLevel'],
    { example: { aiResultConfirmed: true, confirmedLevel: 2, notes: 'Scattered microaneurysms and dot haemorrhages.', recommendations: 'Re-screen in 6 months; control HbA1c.', followUpDate: '2027-05-17T09:00:00.000Z' } },
  ),
  UpdateReviewDto: obj(
    { aiResultConfirmed: bool(), confirmedLevel: int({ enum: DR_LEVELS, description: DR_LEVEL_TEXT }), notes: text(5000), recommendations: text(5000), followUpDate: date() },
    [],
    { example: { notes: 'Scattered microaneurysms and dot haemorrhages in both arcades.' } },
  ),
  CreateReportDto: obj(
    { analysisId: oid(), title: text(200), content: text(10000), recommendations: text(5000, { description: 'Defaults to the review recommendations in the PDF' }) },
    ['analysisId', 'title'],
    { example: { analysisId: '665f1c2e9b1e8a0012ab34cd', title: 'Retina screening report', content: 'Moderate NPDR, no macular oedema seen.' } },
  ),
  UpdateReportDto: obj({ title: text(200), content: text(10000), recommendations: text(5000) }, [], { example: { title: 'Retina screening report (updated)' } }),
};

const q = (name, schema, description, example) => ({ name, schema, description, example });
const PAGE = [q('page', int({ minimum: 1, default: 1 }), 'Page number', 1), q('size', int({ minimum: 1, maximum: 100, default: 20 }), 'Page size', 20)];

const LIMITS = {
  signUp: '3 per hour (blocked 5 h when exceeded)',
  signIn: '5 per minute (blocked 5 h when exceeded)',
  authAttempt: '5 per minute (blocked 1 h)',
  verificationEmail: '3 per hour (blocked 5 h)',
  passwordResetRequest: '3 per minute (blocked 1 h)',
  session: '10 per minute (blocked 15 min)',
  sensitive: '5 per hour (blocked 1 h)',
  aiInference: '10 per minute (blocked 5 min)',
  upload: '20 per minute (blocked 5 min)',
  fileGeneration: '10 per minute',
  create: '30 per minute',
  search: '60 per minute',
};

const set = (variables) => variables;

const endpoints = [
  { tag: 'System', method: 'get', path: '/', name: 'Hello', auth: 'optional', ok: { data: obj({ message: str({ example: 'hello from server side' }) }) } },
  { tag: 'System', method: 'get', path: '/ping', name: 'Ping', auth: 'optional', ok: { data: obj({ message: str({ example: 'pong' }) }) }, description: 'Liveness check; the Docker HEALTHCHECK calls it.' },

  { tag: 'Authentication', method: 'post', path: '/authentication/sign-up', name: 'Sign up', auth: 'none', limit: 'signUp', body: 'SignUpDto', ok: { status: 201, data: ref('AuthUser') }, errors: [409], description: 'Creates a patient (default) or doctor account and emails a 6-digit verification code. Sign-in is refused until the email is verified.' },
  { tag: 'Authentication', method: 'post', path: '/authentication/sign-in', name: 'Sign in', auth: 'none', limit: 'signIn', body: 'SignInDto', ok: { data: ref('TokenPair') }, errors: [401, 404, 409], save: set({ accessToken: 'data.accessToken', refreshToken: 'data.refreshToken' }), description: '409 when the email is not verified yet.' },
  { tag: 'Authentication', method: 'post', path: '/authentication/refresh', name: 'Refresh tokens', auth: 'none', limit: 'session', body: 'RefreshTokenDto', ok: { data: ref('TokenPair') }, errors: [401], save: set({ accessToken: 'data.accessToken', refreshToken: 'data.refreshToken' }), description: 'Refresh tokens are single use: store the new pair.' },
  { tag: 'Authentication', method: 'get', path: '/authentication/token', name: 'Inspect access token', limit: 'session', ok: { data: obj({ header: obj({}), payload: obj({ sub: str(), iss: str(), aud: str(), exp: int(), iat: int() }) }) }, errors: [401], description: 'Verifies the bearer access token and returns its decoded header and claims.' },
  { tag: 'Authentication', method: 'post', path: '/authentication/logout', name: 'Log out', limit: 'session', body: 'LogoutDto', ok: { data: null } },
  { tag: 'Authentication', method: 'post', path: '/authentication/verify-email/send', name: 'Send verification code', auth: 'none', limit: 'verificationEmail', body: 'EmailDto', ok: { status: 202, data: null }, description: 'Always 202, whether or not the account exists.' },
  { tag: 'Authentication', method: 'post', path: '/authentication/verify-email', name: 'Verify email', auth: 'none', limit: 'authAttempt', body: 'VerifyEmailDto', ok: { status: 204 }, errors: [] },
  { tag: 'Authentication', method: 'post', path: '/authentication/forgot-password', name: 'Forgot password', auth: 'none', limit: 'passwordResetRequest', body: 'EmailDto', ok: { status: 202, data: null }, description: 'Emails a 6-digit reset code. Always 202.' },
  { tag: 'Authentication', method: 'post', path: '/authentication/reset-password', name: 'Reset password', auth: 'none', limit: 'authAttempt', body: 'ResetPasswordDto', ok: { status: 204 } },
  { tag: 'Authentication', method: 'post', path: '/authentication/google', name: 'Sign in with Google', auth: 'none', limit: 'signIn', body: 'GoogleSignInDto', ok: { data: ref('TokenPair'), also: [201] }, errors: [401], save: set({ accessToken: 'data.accessToken', refreshToken: 'data.refreshToken' }), description: '201 when a new patient account was created, 200 when an existing account signed in.' },

  { tag: 'User', method: 'get', path: '/user/me', name: 'Get my profile', ok: { data: ref('User') } },
  { tag: 'User', method: 'patch', path: '/user/me', name: 'Update my profile', body: 'UpdateUserDto', ok: { data: ref('User') } },
  { tag: 'User', method: 'put', path: '/user/me/avatar', name: 'Upload avatar', limit: 'upload', multipart: { schema: 'AvatarForm', fields: [{ key: 'avatar', type: 'file' }] }, ok: { data: ref('User') }, errors: [413, 415] },
  { tag: 'User', method: 'delete', path: '/user/me/avatar', name: 'Remove avatar', ok: { data: ref('User') } },
  { tag: 'User', method: 'put', path: '/user/me/devices', name: 'Register push device', body: 'RegisterDeviceDto', ok: { status: 204 }, description: 'Registers an FCM token for push notifications (up to 10 devices per user).' },
  { tag: 'User', method: 'delete', path: '/user/me/devices', name: 'Unregister push device', body: 'DeviceTokenDto', ok: { status: 204 }, errors: [404] },
  { tag: 'User', method: 'get', path: '/photos/avatars/{userId}/{file}', name: 'Get avatar image', auth: 'none', params: { userId: ['userId', 'User id'], file: ['avatarFile', 'File name from avatarUrl'] }, ok: { file: ['image/jpeg', 'image/png', 'image/webp'] }, description: 'Public. Use the avatarUrl returned on the user.' },

  { tag: 'Patient', method: 'post', path: '/patient', name: 'Create patient', roles: ['admin', 'doctor'], limit: 'create', body: 'CreatePatientDto', ok: { status: 201, data: ref('Patient') }, errors: [409], save: set({ patientId: 'data._id' }), description: 'Creates the account and the patient profile (with a medical record number). A doctor is assigned to the new patient automatically.' },
  { tag: 'Patient', method: 'get', path: '/patient', name: 'List patients', roles: ['admin', 'doctor'], limit: 'search', query: [...PAGE, q('search', text(100), 'Name, email or medical record number', undefined)], ok: { data: pageOf(ref('Patient')) }, description: 'Doctors only see their assigned patients.' },
  { tag: 'Patient', method: 'get', path: '/patient/me', name: 'Get my patient profile', roles: ['patient'], ok: { data: ref('Patient') }, errors: [404] },
  { tag: 'Patient', method: 'get', path: '/patient/me/doctors', name: 'List my doctors', roles: ['patient'], ok: { data: arr(ref('AssignedDoctor')) }, save: set({ doctorId: 'data[0] && data[0]._id' }) },
  { tag: 'Patient', method: 'get', path: '/patient/{id}', name: 'Get patient', roles: ['admin', 'doctor'], params: { id: ['patientId', 'Patient profile id'] }, ok: { data: ref('Patient') } },
  { tag: 'Patient', method: 'patch', path: '/patient/{id}', name: 'Update patient', roles: ['admin', 'doctor'], params: { id: ['patientId', 'Patient profile id'] }, body: 'UpdatePatientDto', ok: { data: ref('Patient') } },
  { tag: 'Patient', method: 'delete', path: '/patient/{id}', name: 'Delete patient', roles: ['admin', 'doctor'], limit: 'sensitive', params: { id: ['patientId', 'Patient profile id'] }, ok: { status: 204 }, description: 'Deletes the account, profile and assignments. Doctors can only delete patients they created.' },

  { tag: 'Doctor', method: 'get', path: '/doctor/me/verification', name: 'Get my verification', roles: ['doctor'], ok: { data: ref('DoctorVerification') }, errors: [404], description: 'Works while the account is not approved yet.' },
  { tag: 'Doctor', method: 'put', path: '/doctor/me/verification', name: 'Submit license for review', roles: ['doctor'], limit: 'upload', multipart: { schema: 'SubmitLicenseForm', fields: [{ key: 'licenseNumber', value: 'EG-OPH-20431' }, { key: 'documents', type: 'file' }] }, ok: { data: ref('DoctorVerification') }, errors: [409, 413, 415], description: 'Uploads the license number and 1–3 documents; replaces any earlier submission and sets the status back to pending. Admins are notified. Refused with 409 once the account is approved.' },
  { tag: 'Doctor', method: 'get', path: '/doctor/me/verification/documents/{index}', name: 'View my license document', roles: ['doctor'], params: { index: ['documentIndex', 'Document index (0-based)'] }, ok: { file: ['application/pdf', 'image/jpeg', 'image/png'] }, errors: [404] },
  { tag: 'Doctor', method: 'get', path: '/doctor/me/clinic', name: 'Get my clinic', roles: ['doctor'], ok: { data: ref('DoctorClinic') }, errors: [404] },
  { tag: 'Doctor', method: 'patch', path: '/doctor/me/clinic', name: 'Update my clinic', roles: ['doctor'], body: 'UpdateClinicDto', ok: { data: ref('DoctorClinic') }, description: 'Creates the clinic profile if it does not exist (clinicName and clinicAddress are then required).' },
  { tag: 'Doctor', method: 'post', path: '/doctor/patients', name: 'Create clinic patient', roles: ['doctor'], limit: 'create', body: 'CreatePatientDto', ok: { status: 201, data: ref('Patient') }, errors: [409], save: set({ patientId: 'data._id' }), description: 'Creates a patient locally from the clinic and assigns them to you. The patient is notified.' },
  { tag: 'Doctor', method: 'get', path: '/doctor/patients/search', name: 'Search patients to assign', roles: ['doctor'], limit: 'search', query: [q('search', str({ minLength: 3, maxLength: 100 }), 'Name, email or medical record number (at least 3 characters)', 'ahmed'), q('page', int({ minimum: 1, default: 1 }), 'Page number', 1), q('size', int({ minimum: 1, maximum: 50, default: 10 }), 'Page size', 10)], required: ['search'], ok: { data: pageOf(ref('PatientSearchResult')) }, save: set({ patientId: 'data.docs[0] && data.docs[0]._id' }) },
  { tag: 'Doctor', method: 'post', path: '/doctor/patients/{id}/assign', name: 'Assign patient', roles: ['doctor'], params: { id: ['patientId', 'Patient profile id'] }, ok: { status: 201, data: ref('Patient'), also: [200] }, description: '201 when a new assignment was created, 200 when it already existed (an ended assignment is reactivated). The patient is notified.' },
  { tag: 'Doctor', method: 'delete', path: '/doctor/patients/{id}', name: 'Unassign patient', roles: ['doctor'], params: { id: ['patientId', 'Patient profile id'] }, ok: { status: 204 }, description: 'Ends the assignment (the patient record is kept). The patient is notified.' },

  { tag: 'Appointment', method: 'post', path: '/appointment/availability', name: 'Create availability', roles: ['doctor'], limit: 'create', body: 'CreateAvailabilityDto', ok: { status: 201, data: arr(ref('Slot')) }, errors: [409], save: set({ slotId: 'data[0] && data[0]._id' }) },
  { tag: 'Appointment', method: 'get', path: '/appointment/availability/me', name: 'List my slots', roles: ['doctor'], query: [q('from', date(), 'Start of the range', undefined), q('to', date(), 'End of the range', undefined)], ok: { data: arr(ref('Slot')) } },
  { tag: 'Appointment', method: 'delete', path: '/appointment/availability/{id}', name: 'Delete slot', roles: ['doctor'], params: { id: ['slotId', 'Slot id'] }, ok: { status: 204 }, errors: [409], description: 'Booked slots cannot be deleted.' },
  { tag: 'Appointment', method: 'get', path: '/appointment/doctors/{doctorId}/slots', name: 'List free slots of a doctor', roles: ['patient'], params: { doctorId: ['doctorId', 'Doctor user id (from /patient/me/doctors)'] }, query: [q('date', str({ pattern: '^\\d{4}-\\d{2}-\\d{2}$' }), 'Day in the clinic time zone (YYYY-MM-DD)', '2026-11-20')], required: ['date'], ok: { data: arr(ref('Slot')) }, save: set({ slotId: 'data[0] && data[0]._id' }), description: 'Only for doctors assigned to you. Past slots are left out.' },
  { tag: 'Appointment', method: 'post', path: '/appointment', name: 'Book appointment', roles: ['patient'], limit: 'create', body: 'BookAppointmentDto', ok: { status: 201, data: ref('Appointment') }, errors: [409], save: set({ appointmentId: 'data._id' }), description: 'Confirmed immediately. A patient can have only one appointment per day. The doctor is notified.' },
  { tag: 'Appointment', method: 'get', path: '/appointment/me', name: 'List my appointments', roles: ['doctor', 'patient'], query: [q('status', oneOf(APPOINTMENT_STATUS), 'Filter by status', undefined), q('pendingRequest', bool(), 'Only appointments with a pending cancel/reschedule request', undefined), q('from', date(), 'Scheduled from', undefined), q('to', date(), 'Scheduled until', undefined), ...PAGE], ok: { data: pageOf(ref('Appointment')) }, save: set({ appointmentId: 'data.docs[0] && data.docs[0]._id' }) },
  { tag: 'Appointment', method: 'get', path: '/appointment/{id}', name: 'Get appointment', roles: ['doctor', 'patient'], params: { id: ['appointmentId', 'Appointment id'] }, ok: { data: ref('Appointment') } },
  { tag: 'Appointment', method: 'post', path: '/appointment/{id}/cancel-request', name: 'Request cancellation', roles: ['patient'], params: { id: ['appointmentId', 'Appointment id'] }, body: 'CancelRequestDto', ok: { data: ref('Appointment') }, errors: [409], description: 'The doctor reviews the reason and approves or rejects it.' },
  { tag: 'Appointment', method: 'post', path: '/appointment/{id}/reschedule-request', name: 'Request reschedule', roles: ['patient'], params: { id: ['appointmentId', 'Appointment id'] }, body: 'RescheduleRequestDto', ok: { data: ref('Appointment') }, errors: [409], description: 'Holds the new slot until the doctor decides. At most 3 patient reschedules per appointment.' },
  { tag: 'Appointment', method: 'delete', path: '/appointment/{id}/request', name: 'Withdraw request', roles: ['patient'], params: { id: ['appointmentId', 'Appointment id'] }, ok: { data: ref('Appointment') }, errors: [409] },
  { tag: 'Appointment', method: 'post', path: '/appointment/{id}/request/approve', name: 'Approve request', roles: ['doctor'], params: { id: ['appointmentId', 'Appointment id'] }, body: 'DecideRequestDto', ok: { data: ref('Appointment') }, errors: [409], description: 'Cancels or moves the appointment. The patient is notified.' },
  { tag: 'Appointment', method: 'post', path: '/appointment/{id}/request/reject', name: 'Reject request', roles: ['doctor'], params: { id: ['appointmentId', 'Appointment id'] }, body: 'DecideRequestDto', ok: { data: ref('Appointment') }, errors: [409], description: 'Releases a held slot. The patient is notified.' },

  { tag: 'Chat', method: 'get', path: '/chat/conversations', name: 'List conversations', roles: ['doctor', 'patient'], ok: { data: arr(ref('Conversation')) }, save: set({ conversationId: 'data[0] && data[0]._id' }) },
  { tag: 'Chat', method: 'post', path: '/chat/conversations', name: 'Start conversation', roles: ['doctor', 'patient'], body: 'StartConversationDto', ok: { status: 201, data: ref('Conversation'), also: [200] }, save: set({ conversationId: 'data._id' }), description: 'Requires an active doctor–patient assignment. 201 when created, 200 when it already existed.' },
  { tag: 'Chat', method: 'get', path: '/chat/conversations/{id}/messages', name: 'List messages', roles: ['doctor', 'patient'], params: { id: ['conversationId', 'Conversation id'] }, query: [q('before', date(), 'Load messages older than this (use nextBefore)', undefined), q('limit', int({ minimum: 1, maximum: 100, default: 30 }), 'Messages per page', 30)], ok: { data: ref('MessagePage') }, save: set({ messageId: 'data.docs[0] && data.docs[0]._id' }) },
  { tag: 'Chat', method: 'get', path: '/chat/attachments/{messageId}/{index}', name: 'Download attachment', roles: ['doctor', 'patient'], params: { messageId: ['messageId', 'Message id'], index: ['attachmentIndex', 'Attachment index (0-based)'] }, ok: { file: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'] } },

  { tag: 'Analysis', method: 'get', path: '/analysis/health', name: 'AI service status', roles: ['doctor'], ok: { data: ref('AiHealth') } },
  { tag: 'Analysis', method: 'post', path: '/analysis', name: 'Upload fundus image for analysis', roles: ['doctor'], limit: 'aiInference', multipart: { schema: 'CreateAnalysisForm', fields: [{ key: 'image', type: 'file' }, { key: 'patientId', value: '{{patientId}}' }, { key: 'eye', value: 'left' }, { key: 'notes', value: 'Routine screening', disabled: true }, { key: 'capturedAt', value: '2026-11-17T09:00:00.000Z', disabled: true }] }, ok: { status: 202, data: ref('Analysis') }, errors: [413, 415], save: set({ analysisId: 'data._id' }), description: 'Stores the image and queues it for the AI model; the response is `pending`. Poll GET /analysis/{id} (or wait for the `analysis` notification) until it is `completed` or `failed`.' },
  { tag: 'Analysis', method: 'get', path: '/analysis', name: 'List analyses', roles: ['doctor'], query: [...PAGE, q('patientId', oid(), 'Patient profile id', undefined), q('status', oneOf(ANALYSIS_STATUS), 'Filter by status', undefined), q('hasDR', bool(), 'Filter by stage-1 result', undefined), q('reviewed', bool(), 'Only reviewed / not reviewed', undefined)], ok: { data: pageOf(ref('Analysis')) }, save: set({ analysisId: 'data.docs[0] && data.docs[0]._id' }), description: 'Your own analyses, newest first.' },
  { tag: 'Analysis', method: 'get', path: '/analysis/{id}', name: 'Get analysis', roles: ['doctor'], params: { id: ['analysisId', 'Analysis id'] }, ok: { data: ref('Analysis') } },
  { tag: 'Analysis', method: 'post', path: '/analysis/{id}/retry', name: 'Retry failed analysis', roles: ['doctor'], limit: 'aiInference', params: { id: ['analysisId', 'Analysis id'] }, ok: { status: 202, data: ref('Analysis') }, errors: [409] },
  { tag: 'Analysis', method: 'delete', path: '/analysis/{id}', name: 'Delete analysis', roles: ['doctor'], params: { id: ['analysisId', 'Analysis id'] }, ok: { status: 204 }, errors: [409], description: 'Also deletes the image, heatmap and review. Refused while processing or while a report exists.' },
  { tag: 'Analysis', method: 'get', path: '/analysis/{id}/image', name: 'Get fundus image', roles: ['doctor'], params: { id: ['analysisId', 'Analysis id'] }, ok: { file: ['image/jpeg', 'image/png'] } },
  { tag: 'Analysis', method: 'get', path: '/analysis/{id}/grad-cam', name: 'Get Grad-CAM heatmap', roles: ['doctor'], params: { id: ['analysisId', 'Analysis id'] }, ok: { file: ['image/png'] } },
  { tag: 'Analysis', method: 'get', path: '/analysis/{id}/review', name: 'Get my review', roles: ['doctor'], params: { id: ['analysisId', 'Analysis id'] }, ok: { data: ref('Review') } },
  { tag: 'Analysis', method: 'post', path: '/analysis/{id}/review', name: 'Review analysis', roles: ['doctor'], params: { id: ['analysisId', 'Analysis id'] }, body: 'CreateReviewDto', ok: { status: 201, data: ref('Review') }, errors: [409], description: 'Only completed analyses. One review per analysis.' },
  { tag: 'Analysis', method: 'patch', path: '/analysis/{id}/review', name: 'Update review', roles: ['doctor'], params: { id: ['analysisId', 'Analysis id'] }, body: 'UpdateReviewDto', ok: { data: ref('Review') }, errors: [409], description: 'Locked once the report was sent.' },

  { tag: 'Report', method: 'post', path: '/report', name: 'Generate report', roles: ['doctor'], limit: 'fileGeneration', body: 'CreateReportDto', ok: { status: 201, data: ref('Report') }, errors: [409], save: set({ reportId: 'data._id' }), description: 'Creates a draft and its PDF. Requires a completed analysis, your review, and a note (review notes or report content). One report per analysis.' },
  { tag: 'Report', method: 'get', path: '/report', name: 'List reports', roles: ['doctor', 'patient'], query: [...PAGE, q('patientId', oid(), 'Doctors: patient profile id', undefined), q('status', oneOf(['draft', 'sent']), 'Doctors: filter by status', undefined)], ok: { data: pageOf(ref('Report')) }, save: set({ reportId: 'data.docs[0] && data.docs[0]._id' }), description: 'Doctors see the reports they wrote; patients see the reports sent to them.' },
  { tag: 'Report', method: 'get', path: '/report/{id}', name: 'Get report', roles: ['doctor', 'patient'], params: { id: ['reportId', 'Report id'] }, ok: { data: ref('Report') }, description: 'Patients get 404 for drafts.' },
  { tag: 'Report', method: 'patch', path: '/report/{id}', name: 'Update draft report', roles: ['doctor'], limit: 'fileGeneration', params: { id: ['reportId', 'Report id'] }, body: 'UpdateReportDto', ok: { data: ref('Report') }, errors: [409], description: 'Regenerates the PDF.' },
  { tag: 'Report', method: 'post', path: '/report/{id}/regenerate', name: 'Regenerate PDF', roles: ['doctor'], limit: 'fileGeneration', params: { id: ['reportId', 'Report id'] }, ok: { data: ref('Report') }, errors: [409], description: 'Rebuilds the draft PDF, e.g. after the review changed.' },
  { tag: 'Report', method: 'post', path: '/report/{id}/send', name: 'Send report to patient', roles: ['doctor'], limit: 'fileGeneration', params: { id: ['reportId', 'Report id'] }, ok: { data: ref('Report') }, errors: [409], description: 'Renders the final PDF, marks the report sent and notifies the patient. The report and review are locked afterwards.' },
  { tag: 'Report', method: 'delete', path: '/report/{id}', name: 'Delete draft report', roles: ['doctor'], params: { id: ['reportId', 'Report id'] }, ok: { status: 204 }, errors: [409] },
  { tag: 'Report', method: 'get', path: '/report/{id}/download', name: 'Download report PDF', roles: ['doctor', 'patient'], params: { id: ['reportId', 'Report id'] }, ok: { file: ['application/pdf'] }, description: 'Sent as an attachment. The first patient download sets viewedAt.' },

  { tag: 'Notification', method: 'get', path: '/notification', name: 'List notifications', query: [q('unread', bool(), 'Only unread', undefined), ...PAGE], ok: { data: pageOf(ref('Notification'), { unreadCount: int() }) }, save: set({ notificationId: 'data.docs[0] && data.docs[0]._id' }) },
  { tag: 'Notification', method: 'get', path: '/notification/unread-count', name: 'Unread count', ok: { data: obj({ unreadCount: int() }) } },
  { tag: 'Notification', method: 'patch', path: '/notification/read-all', name: 'Mark all read', ok: { data: obj({ updated: int() }) } },
  { tag: 'Notification', method: 'patch', path: '/notification/{id}/read', name: 'Mark read', params: { id: ['notificationId', 'Notification id'] }, ok: { data: ref('Notification') } },
  { tag: 'Notification', method: 'delete', path: '/notification/{id}', name: 'Delete notification', params: { id: ['notificationId', 'Notification id'] }, ok: { status: 204 } },
  { tag: 'Admin', method: 'get', path: '/admin/doctors', name: 'List doctors', roles: ['admin'], query: [q('status', oneOf(['pending', 'approved', 'rejected']), 'Verification status', 'pending'), q('submitted', bool(), 'true: only doctors who uploaded license documents', true), q('search', text(100), 'Name, email, license number or clinic', undefined), q('page', int({ minimum: 1, default: 1 }), 'Page number', 1), q('size', int({ minimum: 1, maximum: 50, default: 10 }), 'Page size', 10)], ok: { data: pageOf(ref('AdminDoctor')) }, save: set({ adminDoctorId: 'data.docs[0] && data.docs[0]._id' }), description: 'The review queue is `status=pending&submitted=true`.' },
  { tag: 'Admin', method: 'get', path: '/admin/doctors/{id}', name: 'Get doctor', roles: ['admin'], params: { id: ['adminDoctorId', 'Doctor profile id'] }, ok: { data: ref('AdminDoctor') }, errors: [404] },
  { tag: 'Admin', method: 'get', path: '/admin/doctors/{id}/documents/{index}', name: 'View license document', roles: ['admin'], params: { id: ['adminDoctorId', 'Doctor profile id'], index: ['documentIndex', 'Document index (0-based)'] }, ok: { file: ['application/pdf', 'image/jpeg', 'image/png'] }, errors: [404] },
  { tag: 'Admin', method: 'post', path: '/admin/doctors/{id}/approve', name: 'Approve doctor', roles: ['admin'], params: { id: ['adminDoctorId', 'Doctor profile id'] }, ok: { data: ref('AdminDoctor') }, errors: [404, 409], description: 'Gives the doctor access to analyses, reports, patients, appointments and chat. Works on pending or rejected doctors; needs a license number. The doctor is notified.' },
  { tag: 'Admin', method: 'post', path: '/admin/doctors/{id}/reject', name: 'Reject doctor', roles: ['admin'], params: { id: ['adminDoctorId', 'Doctor profile id'] }, body: 'RejectDoctorDto', ok: { data: ref('AdminDoctor') }, errors: [404], description: 'Also revokes an approved doctor. The doctor is notified with the reason and can submit again.' },
  { tag: 'Admin', method: 'patch', path: '/admin/users/{id}/status', name: 'Enable or disable user', roles: ['admin'], params: { id: ['userId', 'User id'] }, body: 'UpdateUserStatusDto', ok: { data: ref('UserStatus') }, errors: [404], description: 'Disabling signs the user out everywhere. You cannot disable your own account.' },
];

const SOCKET_DOC = `### Real-time chat (socket.io)

Namespace \`/chat\`. Send the access token in the handshake:

\`\`\`js
const socket = io('${BASE_URL}/chat', { auth: { token: accessToken } });
\`\`\`

Only active doctors and patients with an assignment can chat. Every event is authenticated; failures arrive as an \`exception\` event (or the ack): \`{ status: 'error', statusCode, message, event }\`.

**Client → server** (all acknowledged)

| Event | Payload | Ack |
|---|---|---|
| \`join_conversation\` | \`{ conversationId }\` | \`{ status: 'ok', conversationId }\` |
| \`leave_conversation\` | \`{ conversationId }\` | \`{ status: 'ok', conversationId }\` |
| \`send_message\` | \`{ conversationId, message?, attachments?: [{ name?, data }], clientId? }\` — \`data\` is base64 or bytes; JPEG, PNG, WEBP or PDF, 5 MB each, at most 4 | \`{ status: 'ok', message: ChatMessage }\` |
| \`typing\` | \`{ conversationId, isTyping }\` | \`{ status: 'ok' }\` |
| \`read\` | \`{ conversationId, messageId? }\` | \`{ status: 'ok', count, upTo }\` |

**Server → client**

| Event | Payload |
|---|---|
| \`new_message\` | \`ChatMessage\` (to both participants) |
| \`typing\` | \`{ conversationId, userId, isTyping }\` (to the other participant in the room) |
| \`read\` | \`{ conversationId, userId, upTo, count }\` |

A push notification is sent when the recipient is not in the conversation room.`;

const TAGS = [
  { name: 'System' },
  { name: 'Authentication', description: 'Accounts, tokens and email verification. Access tokens go in `Authorization: Bearer <token>`.' },
  { name: 'User', description: 'The signed-in user: profile, avatar and push-notification devices.' },
  { name: 'Patient', description: 'Patient records. `{id}` is the patient profile id, not the user id.' },
  { name: 'Doctor', description: 'Clinic profile, license verification and the doctor’s patient list. Until an admin approves the license, a doctor can only use the `me/clinic` and `me/verification` routes.' },
  { name: 'Admin', description: 'Admin only. Review doctor licenses (approve or reject, the admin has the final decision) and enable or disable accounts. The first admin is created at startup from ADMIN_EMAIL and ADMIN_PASSWORD.' },
  { name: 'Appointment', description: 'Doctors publish availability as slots; patients book one appointment per day. Cancelling or rescheduling is a request the doctor approves or rejects.' },
  { name: 'Chat', description: `REST endpoints for history and attachments.\n\n${SOCKET_DOC}` },
  {
    name: 'Analysis',
    description: `AI screening of fundus images in two stages: **stage 1** detects diabetic retinopathy (available now), **stage 2** grades its severity 0–4 (shown as unavailable until the grading model is deployed).\n\nFlow: upload → \`pending\` → \`processing\` → \`completed\` / \`failed\` (retry) → doctor review → report.`,
  },
  { name: 'Report', description: 'PDF reports. A report needs a completed analysis, the doctor’s review and a note. Drafts can be edited; sending locks the report and notifies the patient, who can then download it.' },
  { name: 'Notification', description: 'In-app notification inbox (also pushed through FCM to registered devices).' },
];

const ERRORS = {
  400: ['BadRequest', 'Validation failed or the request is not allowed in the current state'],
  401: ['Unauthorized', 'Missing, invalid or expired access token'],
  403: ['Forbidden', 'Your role or relationship does not allow this'],
  404: ['NotFound', 'Not found'],
  409: ['Conflict', 'Conflicts with the current state'],
  413: ['PayloadTooLarge', 'File too large'],
  415: ['UnsupportedMediaType', 'File type not allowed'],
  429: ['TooManyRequests', 'Rate limit exceeded'],
};

const envelope = (data) => obj({ message: str({ example: 'Request completed successfully' }), ...(data && { data }) }, ['message']);
const pathParams = (path) => [...path.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
const operationId = (name) => name.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').map((word, index) => (index ? word[0].toUpperCase() + word.slice(1) : word.toLowerCase())).join('');

const buildOpenApi = () => {
  const paths = {};
  for (const endpoint of endpoints) {
    const auth = endpoint.auth ?? 'bearer';
    const params = pathParams(endpoint.path);
    const status = endpoint.ok.status ?? 200;
    const roles = endpoint.roles;

    const responses = {};
    const success = (code) => {
      if (code === 204) return { description: 'No content' };
      if (endpoint.ok.file) return { description: 'The file', content: Object.fromEntries(endpoint.ok.file.map((type) => [type, { schema: str({ format: 'binary' }) }])) };
      return { description: 'Success', content: { 'application/json': { schema: envelope(endpoint.ok.data) } } };
    };
    responses[status] = success(status);
    for (const code of endpoint.ok.also ?? []) responses[code] = success(code);

    const errorCodes = new Set(endpoint.errors ?? []);
    if (endpoint.body || endpoint.multipart || endpoint.query || params.length) errorCodes.add(400);
    if (auth === 'bearer') errorCodes.add(401);
    if (roles || auth === 'bearer') errorCodes.add(403);
    if (params.length) errorCodes.add(404);
    errorCodes.add(429);
    for (const code of [...errorCodes].sort()) responses[code] = { $ref: `#/components/responses/${ERRORS[code][0]}` };

    const descriptionParts = [
      endpoint.description,
      roles && `**Roles:** ${roles.join(', ')}`,
      endpoint.limit && `**Rate limit:** ${LIMITS[endpoint.limit]}`,
    ].filter(Boolean);

    const operation = {
      tags: [endpoint.tag],
      summary: endpoint.name,
      operationId: operationId(endpoint.name),
      ...(descriptionParts.length && { description: descriptionParts.join('\n\n') }),
      security: auth === 'none' ? [] : auth === 'optional' ? [{}, { bearerAuth: [] }] : [{ bearerAuth: [] }],
      parameters: [
        ...params.map((name) => ({ name, in: 'path', required: true, description: endpoint.params?.[name]?.[1], schema: name === 'index' ? int({ minimum: 0 }) : name === 'file' ? str() : oid() })),
        ...(endpoint.query ?? []).map((param) => ({ name: param.name, in: 'query', required: (endpoint.required ?? []).includes(param.name), description: param.description, schema: param.schema, ...(param.example !== undefined && { example: param.example }) })),
        { $ref: '#/components/parameters/Language' },
      ],
      ...(endpoint.body && { requestBody: { required: true, content: { 'application/json': { schema: ref(endpoint.body) } } } }),
      ...(endpoint.multipart && { requestBody: { required: true, content: { 'multipart/form-data': { schema: ref(endpoint.multipart.schema) } } } }),
      responses,
    };
    paths[endpoint.path] ??= {};
    paths[endpoint.path][endpoint.method] = operation;
  }

  return {
    openapi: '3.0.3',
    info: {
      title: 'RetinaCare API',
      version: pkg.version,
      description: [
        'Backend for diabetic-retinopathy screening: patients, doctors, appointments, chat, AI analysis of fundus images and PDF reports.',
        '**Responses.** Successful JSON responses are wrapped as `{ "message": string, "data": ... }`. File endpoints return the raw file. Errors use `ErrorResponse`.',
        '**Language.** Messages and validation errors are returned in English or Arabic, chosen by `?language=`, then the `x-language` header, then `Accept-Language`.',
        '**Ids.** All ids are 24-character MongoDB ObjectIds; a malformed id returns 400.',
        '**Rate limits.** 120 requests per minute per user by default; stricter limits are listed on the endpoints that have them.',
      ].join('\n\n'),
    },
    servers: [{ url: '{baseUrl}', variables: { baseUrl: { default: BASE_URL, description: 'API origin' } } }],
    tags: TAGS,
    paths,
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Access token from sign-in, refresh or Google sign-in' } },
      parameters: { Language: { name: 'x-language', in: 'header', required: false, description: 'Response language', schema: oneOf(['en', 'ar'], { default: 'en' }) } },
      responses: Object.fromEntries(Object.values(ERRORS).map(([name, description]) => [name, { description, content: { 'application/json': { schema: ref('ErrorResponse') } } }])),
      schemas,
    },
  };
};

const POSTMAN_VALUES = { refreshToken: '{{refreshToken}}', slotId: '{{slotId}}', participantId: '{{doctorId}}', analysisId: '{{analysisId}}' };

const exampleOf = (name) => Object.fromEntries(Object.entries(schemas[name].example ?? {}).map(([key, value]) => [key, POSTMAN_VALUES[key] ?? value]));

const postmanUrl = (endpoint) => {
  const params = endpoint.params ?? {};
  const path = endpoint.path.replace(/\{(\w+)\}/g, (_, name) => `{{${params[name]?.[0] ?? name}}}`);
  const segments = path.split('/').filter(Boolean);
  const query = (endpoint.query ?? []).map((param) => ({
    key: param.name,
    value: param.example !== undefined ? String(param.example) : '',
    description: param.description,
    disabled: !(endpoint.required ?? []).includes(param.name) && param.example === undefined,
  }));
  const raw = `{{baseUrl}}${path}${query.filter((item) => !item.disabled).length ? `?${query.filter((item) => !item.disabled).map((item) => `${item.key}=${item.value}`).join('&')}` : ''}`;
  return { raw, host: ['{{baseUrl}}'], path: segments, ...(query.length && { query }) };
};

const saveScript = (variables) => [
  'if (pm.response.code >= 200 && pm.response.code < 300) {',
  '  const body = pm.response.json();',
  '  const data = body && body.data;',
  ...Object.entries(variables).map(([name, expression]) => `  { const value = ${expression}; if (value !== undefined && value !== null) pm.collectionVariables.set('${name}', value); }`),
  '}',
];

const buildPostman = () => {
  const folders = TAGS.map((tag) => ({
    name: tag.name,
    ...(tag.description && { description: tag.description }),
    item: endpoints
      .filter((endpoint) => endpoint.tag === tag.name)
      .map((endpoint) => {
        const auth = endpoint.auth ?? 'bearer';
        const description = [endpoint.description, endpoint.roles && `**Roles:** ${endpoint.roles.join(', ')}`, endpoint.limit && `**Rate limit:** ${LIMITS[endpoint.limit]}`].filter(Boolean).join('\n\n');
        const header = [{ key: 'x-language', value: '{{language}}' }];
        let body;
        if (endpoint.body) {
          header.push({ key: 'Content-Type', value: 'application/json' });
          body = { mode: 'raw', raw: JSON.stringify(exampleOf(endpoint.body), null, 2), options: { raw: { language: 'json' } } };
        }
        if (endpoint.multipart) {
          body = {
            mode: 'formdata',
            formdata: endpoint.multipart.fields.map((field) => (field.type === 'file' ? { key: field.key, type: 'file', src: [] } : { key: field.key, value: field.value, type: 'text', ...(field.disabled && { disabled: true }) })),
          };
        }
        return {
          name: endpoint.name,
          ...(endpoint.save && { event: [{ listen: 'test', script: { type: 'text/javascript', exec: saveScript(endpoint.save) } }] }),
          request: {
            method: endpoint.method.toUpperCase(),
            ...(auth !== 'bearer' && { auth: { type: 'noauth' } }),
            header,
            ...(body && { body }),
            url: postmanUrl(endpoint),
            ...(description && { description }),
          },
          response: [],
        };
      }),
  }));

  const variables = ['patientId', 'doctorId', 'userId', 'avatarFile', 'slotId', 'appointmentId', 'conversationId', 'messageId', 'attachmentIndex', 'analysisId', 'reportId', 'notificationId'];
  return {
    info: {
      _postman_id: 'f3b8a0d2-5c1e-4b7a-9d3e-2a6c8e1f4b90',
      name: 'RetinaCare API',
      description: [
        `Generated from the same source as swagger.json (version ${pkg.version}). Regenerate with \`npm run docs:generate\`.`,
        '1. Set `baseUrl` (default ' + BASE_URL + ').',
        '2. Run **Authentication → Sign in**: the tokens are saved to the collection variables and every request uses `{{accessToken}}`.',
        '3. Requests that create or list things save the ids they return (`patientId`, `slotId`, `appointmentId`, `analysisId`, `reportId`, …) for the next requests.',
        '4. Set `language` to `ar` for Arabic messages.',
        'For file uploads (avatar, fundus image) pick the file in the request body.',
        SOCKET_DOC,
      ].join('\n\n'),
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }] },
    variable: [
      { key: 'baseUrl', value: BASE_URL },
      { key: 'language', value: 'en' },
      { key: 'accessToken', value: '' },
      { key: 'refreshToken', value: '' },
      ...variables.map((key) => ({ key, value: key === 'attachmentIndex' ? '0' : '' })),
    ],
    item: folders,
  };
};

mkdirSync(OUT, { recursive: true });
const openapi = buildOpenApi();
const postman = buildPostman();
writeFileSync(join(OUT, 'swagger.json'), `${JSON.stringify(openapi, null, 2)}\n`);
writeFileSync(join(OUT, 'postman.json'), `${JSON.stringify(postman, null, 2)}\n`);
console.log(`swagger.json: ${Object.values(openapi.paths).reduce((total, item) => total + Object.keys(item).length, 0)} operations, ${Object.keys(schemas).length} schemas`);
console.log(`postman.json: ${postman.item.reduce((total, folder) => total + folder.item.length, 0)} requests in ${postman.item.length} folders`);
