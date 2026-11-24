import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext, type GqlContextType } from '@nestjs/graphql';

import type { IUser } from '../interface/database.interface.js';

const USER_OF = Symbol.for('nestjs.authentication.userOf');

type Carrier = {
  user?: IUser | null;
  data?: { user?: IUser | null };
  [USER_OF]?: (context: ExecutionContext) => IUser | null | undefined;
};

const carrierOf = (context: ExecutionContext): Carrier | undefined => {
  switch (context.getType<GqlContextType>()) {
    case 'http':
      return context.switchToHttp().getRequest<Carrier>();
    case 'ws':
      return context.switchToWs().getClient<Carrier>();
    case 'graphql':
      return GqlExecutionContext.create(context).getContext<{ req?: Carrier }>().req;
    default:
      return undefined;
  }
};

export const resolveUser = (context: ExecutionContext): IUser | null => {
  const carrier = carrierOf(context);
  if (!carrier) return null;
  const recorded = carrier[USER_OF]?.(context);
  if (recorded !== undefined) return recorded;
  return carrier.user ?? carrier.data?.user ?? null;
};

export const User = createParamDecorator((key: keyof IUser | undefined, context: ExecutionContext) => {
  const user = resolveUser(context);
  return key && user ? user[key] : user;
});
