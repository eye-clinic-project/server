import { ConfigService } from '@nestjs/config';
import type { AuthenticationModuleOptions, Duration } from '@nestjs/authentication';

export function createAuthenticationOptions(config: ConfigService): AuthenticationModuleOptions {
  const token = (kind: 'accessToken' | 'refreshToken', defaultTtl: Duration) => ({
    key: config.getOrThrow<string>(`app.auth.${kind}.systemSignature`),
    issuer: config.getOrThrow<string>('app.issuer'),
    audience: config.getOrThrow<string[]>(`app.auth.${kind}.audience`),
    ttl: config.get<Duration>(`app.auth.${kind}.expiresIn`) ?? defaultTtl,
  });

  return {
    session: {},
    accessToken: token('accessToken', '15m'),
    refreshToken: token('refreshToken', '15d'),
  };
}
