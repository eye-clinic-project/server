export const USER_AVATAR_CHANGED_EVENT = 'user.avatar-changed';

export class UserAvatarChangedEvent {
  constructor(
    public readonly userId: string,
    public readonly previousKey: string | null,
    public readonly currentKey: string,
  ) {}
}
