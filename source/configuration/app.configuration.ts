import { registerAs } from '@nestjs/config';

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
};

const toTrustProxy = (value: string | undefined): boolean | number | string => {
  if (value === undefined || value.trim() === '') return 'loopback, linklocal, uniquelocal';
  if (value === 'true' || value === 'false') return value === 'true';
  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : value;
};

const toList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const appConfiguration = registerAs('app', () => ({
  name: process.env.APP_NAME ?? 'RetinaCare',
  environment: process.env.NODE_ENV ?? 'development',
  port: toNumber(process.env.PORT, 9090),
  maintenanceMode: toBoolean(process.env.MAINTENANCE_MODE),
  appUrl: process.env.APP_URL ?? 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL,
  corsOrigins: toList(process.env.CORS_ORIGINS ?? process.env.FRONTEND_URL),
  trustProxy: toTrustProxy(process.env.TRUST_PROXY),
  bodyLimit: process.env.BODY_LIMIT ?? '1mb',
  issuer: process.env.AUTH_ISSUER,

  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },

  database: {
    uri: process.env.DATABASE_URI,
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  },

  security: {
    encryptionKey: process.env.ENCRYPTION_KEY,
    encryptionSecretKey: process.env.ENCRYPTION_SECRET_KEY,
    ivLength: toNumber(process.env.IV_LENGTH, 16),
    hashSalt: toNumber(process.env.HASH_SALT, 12),
  },

  auth: {
    accessToken: {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN ?? '15m',
      systemSignature: process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE,
      audience: ['doctor', 'patient'],
    },

    refreshToken: {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '15d',
      systemSignature: process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE,
      audience: ['doctor', 'patient'],
    },
  },

  mail: {
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: toNumber(process.env.MAIL_PORT, 465),
    email: process.env.APP_MAIL,
    password: process.env.APP_PASSWORD,
  },

  oauth: {
    google: {
      clientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET,
    },
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  storage: {
    driver: process.env.STORAGE_DRIVER ?? 'local',
    root: process.env.STORAGE_ROOT ?? 'storage',
    signingKey: process.env.STORAGE_SIGNING_KEY,
    maxImageSizeMb: toNumber(process.env.MAX_IMAGE_SIZE_MB, 10),
  },

  throttler: {
    limit: toNumber(process.env.THROTTLE_LIMIT, 120),
    disabled: toBoolean(process.env.THROTTLE_DISABLED),
    ttl: 60_000,
  },

  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },

  notifications: {
    timezone: process.env.NOTIFICATION_TIMEZONE ?? 'Africa/Cairo',
    maxDevicesPerUser: toNumber(process.env.MAX_DEVICES_PER_USER, 10),
  },

  ai: {
    mode: process.env.AI_MODE ?? 'disabled',
    url: process.env.AI_SERVICE_URL,
    apiKey: process.env.AI_SERVICE_API_KEY,
    timeout: toNumber(process.env.AI_TIMEOUT_MS, 60_000),
  },
}));
