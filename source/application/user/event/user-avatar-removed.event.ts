export const USER_AVATAR_REMOVED_EVENT = 'user.avatar-removed';

export class UserAvatarRemovedEvent {
  constructor(
    public readonly userId: string,
    public readonly removedKey: string | null,
  ) {}
}
