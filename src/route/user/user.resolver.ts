// import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
// import { Auth } from '../../common/decorator/auth.decorator.js';
// import { User } from '../../common/decorator/user.decorator.js';
// import { UserRoleEnum } from '../../common/enum/security.enum.js';
// import type { HUserDocument } from '../../core/database/model/user.model.js';
// import { UserService } from './user.service.js';


// @Resolver(() => UserProfileGraphqlType)
// @Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
// export class UserResolver {
//   constructor(private readonly users: UserService) {}

//   @Query(() => UserProfileGraphqlType, { name: 'myProfile' })
//   findMyProfile(@User() user: HUserDocument) {
//     return this.users.findMyProfile(user._id);
//   }

//   @Mutation(() => UserProfileGraphqlType)
//   updateMyProfile(
//     @User() user: HUserDocument,
//     @Args('input') input: UpdateMyProfileInput,
//   ) {
//     return this.users.updateMyProfile(user._id, input);
//   }
// }
