export const EMAIL_VERIFICATION_REQUESTED_EVENT = 'user.email-verification-requested';

export class AuthenticateEmailVerificationRequestedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
