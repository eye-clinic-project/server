import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtError, JwtVerifier, type JwtClaims } from '@nestjs/authentication';

export interface DecodedToken {
  header: Record<string, unknown>;
  payload: JwtClaims;
}

@Injectable()
export class JwtTokenService {
  private readonly verifier: JwtVerifier;

  constructor(configService: ConfigService) {
    this.verifier = new JwtVerifier({
      key: configService.getOrThrow<string>('app.auth.accessToken.systemSignature'),
      issuer: configService.getOrThrow<string>('app.issuer'),
      audience: configService.getOrThrow<string[]>('app.auth.accessToken.audience'),
    });
  }

  decode(token: string): DecodedToken {
    const parts = token.split('.');
    if (parts.length !== 3) throw new UnauthorizedException('Invalid token payload');
    try {
      const parse = (part: string) => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
      return { header: parse(parts[0]), payload: parse(parts[1]) };
    } catch {
      throw new UnauthorizedException('Invalid token payload');
    }
  }

  async verify(token: string): Promise<JwtClaims> {
    try {
      return await this.verifier.verify(token);
    } catch (error) {
      if (error instanceof JwtError) throw new UnauthorizedException('Invalid token claims');
      throw error;
    }
  }
}
