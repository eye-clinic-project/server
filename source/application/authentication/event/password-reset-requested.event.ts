export const PASSWORD_RESET_REQUESTED_EVENT = 'user.password-reset-requested';

export class AuthenticatePasswordResetRequestedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
  ) {}
}
