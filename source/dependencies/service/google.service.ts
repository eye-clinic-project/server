import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwksClient, JwtError, JwtVerifier } from '@nestjs/authentication';

const GOOGLE_JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs';

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'] as const;

export interface GoogleProfile {
  subject: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

@Injectable()
export class GoogleIdentityService {
  private readonly verifiers: Map<string, JwtVerifier> | null;

  constructor(configService: ConfigService) {
    const clientIds = (configService.get<string>('app.oauth.google.clientId') ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (clientIds.length === 0) {
      this.verifiers = null;
      return;
    }
    const jwks = new JwksClient(GOOGLE_JWKS_URI);
    this.verifiers = new Map(GOOGLE_ISSUERS.map((issuer) => [issuer, new JwtVerifier({ jwks, issuer, audience: clientIds, clockTolerance: '30s' })]));
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    if (!this.verifiers) throw new ServiceUnavailableException('Google sign-in is not configured');

    const verifier = this.verifiers.get(unverifiedIssuer(idToken) ?? '');
    if (!verifier) throw new UnauthorizedException('Invalid Google credential');

    let claims: Record<string, unknown>;
    try {
      claims = await verifier.verify(idToken);
    } catch (error) {
      if (error instanceof JwtError) throw new UnauthorizedException('Invalid Google credential');
      throw new ServiceUnavailableException('Google credential verification is unavailable');
    }

    const { sub, email, email_verified, name, picture } = claims;
    if (typeof sub !== 'string' || typeof email !== 'string') throw new UnauthorizedException('Invalid Google credential');
    return {
      subject: sub,
      email: email.trim().toLowerCase(),
      emailVerified: email_verified === true || email_verified === 'true',
      name: typeof name === 'string' ? name : undefined,
      picture: typeof picture === 'string' ? picture : undefined,
    };
  }
}

function unverifiedIssuer(token: string): string | undefined {
  const payload = token.split('.')[1];
  if (!payload) return undefined;
  try {
    const { iss } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { iss?: unknown };
    return typeof iss === 'string' ? iss : undefined;
  } catch {
    return undefined;
  }
}
