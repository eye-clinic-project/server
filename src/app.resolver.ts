import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  @Query(() => String, { name: 'healthCheck' })
  healthCheck(): string {
    return 'GraphQL is working';
  }
}
