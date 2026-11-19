export const USER_REGISTERED_EVENT = 'user.registered';

export class AuthenticateRegisteredEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly language: string,
  ) {}
}
