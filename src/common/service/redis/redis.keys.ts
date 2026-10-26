export const RedisKeys = {
  otp: (email: string) => `otp:${email.toLowerCase()}`,
  rateLimit: (scope: string, id: string) => `rate:${scope}:${id}`,
  analysisStatus: (analysisId: string) => `analysis:status:${analysisId}`,
  tokenRevocation: (userId: string, jti: string) =>
    `auth:revoked:${userId}:${jti}`,
} as const;