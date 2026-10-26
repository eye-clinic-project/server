export const RedisKeys = {
  otp: (email: string) => `otp:${email.toLowerCase()}`,
  rateLimit: (scope: string, id: string) => `rate:${scope}:${id}`,
  analysisStatus: (analysisId: string) => `analysis:status:${analysisId}`,
} as const;