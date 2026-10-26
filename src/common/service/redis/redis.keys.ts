export const RedisKeys = {
  otpKey: (email: string) => `otp:${email.toLowerCase()}`,
  rateLimitKey: (scope: string, id: string) => `rate:${scope}:${id}`,
  tokenRevocation: (userId: string, jti: string) =>
    `auth:revoke:${userId}:${jti}`,
  setTokens : (userId: string, jti: string) =>
    `auth:token:${userId}:${jti}`,
} as const;