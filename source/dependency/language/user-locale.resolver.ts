import { LocaleResolver, type LocaleResolverInput } from '@nestjs/i18n';
import type { IAuthReq, IAuthSocket } from '../interface/ctx.interface.js';

/**
 * Uses the language the signed-in user saved in their profile (PATCH /users/me { lang }).
 * Runs after guards, because the user is only known once AuthGuard has run.
 */
export class UserLocaleResolver extends LocaleResolver {
  readonly afterGuards = true;

  resolve({ executionContext }: LocaleResolverInput): string | undefined {
    if (!executionContext) return undefined;
    const holder =
      executionContext.getType() === 'ws'
        ? executionContext.switchToWs().getClient<IAuthSocket>()
        : executionContext.getType() === 'http'
          ? executionContext.switchToHttp().getRequest<IAuthReq>()
          : undefined;
    return holder?.credentials?.user?.lang ?? undefined;
  }
}
