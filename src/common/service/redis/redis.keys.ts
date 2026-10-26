export const RedisKeys = {
  otpKey: (email: string) => `otp:${email.toLowerCase()}`,
  rateLimitKey: (scope: string, id: string) => `rate:${scope}:${id}`,
  userToken: (userId: string, jti: string) =>
    `auth:token:${userId}:${jti}`,
  userTokens: (userId: string) => `auth:token:${userId}:*`,
} as const;