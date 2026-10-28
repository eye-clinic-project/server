import { SetMetadata } from '@nestjs/common';
import { RateLimitOptions } from '../interface/decorator.interface.js';

export const rateLimitName = 'rateLimit';
export const RateLimit = (options: RateLimitOptions) => {
  return SetMetadata(rateLimitName, options);
};
