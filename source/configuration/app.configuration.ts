export default () => ({
  app: {
    port: parseInt(process.env.PORT ?? '', 10) || 3000,
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  },
  database: {
    uri: process.env.DATABASE_URI,
  },
  redis: {
    uri: process.env.REDIS_URI,
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT ?? '', 10) || 6379,
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  auth: {
    issuer: process.env.AUTH_ISSUER,
  },
  mail: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '', 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM,
  },
});
