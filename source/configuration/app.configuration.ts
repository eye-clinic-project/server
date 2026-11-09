const toInt = (value: string | undefined, fallback: number) =>
  parseInt(value ?? '', 10) || fallback;

export default () => ({
  app: {
    port: toInt(process.env.PORT, 3000),
    corsOrigin: (
      process.env.CORS_ORIGIN ??
      process.env.FRONTEND_URL ??
      'http://localhost:3000'
    )
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    maintenance: ['1', 'true'].includes(
      process.env.MAINTENANCE_MODE?.toLowerCase() ?? '',
    ),
  },
  database: {
    uri: process.env.DATABASE_URI,
  },
  redis: {
    uri: process.env.REDIS_URI,
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: toInt(process.env.REDIS_PORT, 6379),
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? process.env.OAUTH_GOOGLE_CLIENT_ID,
  },
  auth: {
    issuer: process.env.AUTH_ISSUER,
  },
  mail: {
    // Falls back to the Gmail app-password variables already used in .env.development
    host:
      process.env.SMTP_HOST ??
      (process.env.APP_MAIL ? 'smtp.gmail.com' : undefined),
    port: toInt(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? process.env.APP_MAIL,
    password: process.env.SMTP_PASSWORD ?? process.env.APP_PASSWORD,
    from:
      process.env.MAIL_FROM ??
      (process.env.APP_MAIL
        ? `"${process.env.APP_NAME ?? 'RetinaCare'}" <${process.env.APP_MAIL}>`
        : undefined),
  },
  storage: {
    // Private directory for uploaded fundus images, avatars and Grad-CAM overlays.
    // Files are AES-256-GCM encrypted at rest and only served through authorised routes.
    directory: process.env.STORAGE_DIR ?? 'storage',
    maxImageSizeMb: toInt(process.env.MAX_IMAGE_SIZE_MB, 10),
  },
  ai: {
    // disabled: analyses fail with "AI service unavailable" and can be retried later
    // mock:     deterministic fake result for UI demos (clearly flagged as mock)
    // remote:   POST the image to the FastAPI service at AI_SERVICE_URL
    mode: (process.env.AI_MODE ?? 'disabled').toLowerCase() as
      | 'disabled'
      | 'mock'
      | 'remote',
    url: process.env.AI_SERVICE_URL,
    timeoutMs: toInt(process.env.AI_TIMEOUT_MS, 20_000),
    apiKey: process.env.AI_SERVICE_API_KEY,
  },
});
