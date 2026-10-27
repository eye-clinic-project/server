import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import { GraphQLJSON } from '../../common/graphql/json.scalar.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { AnalysisService } from './analysis.service.js';

@Resolver()
@Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
export class AnalysisResolver {
  constructor(private readonly analysis: AnalysisService) {}

  @Query(() => GraphQLJSON, { name: 'analyses' })
  findAll(@User() user: HUserDocument) {
    return this.analysis.findForUser(user._id.toString(), user.role);
  }

  @Query(() => GraphQLJSON, { name: 'analysis' })
  findOne(
    @User() user: HUserDocument,
    @Args('analysisId', { type: () => ID }) analysisId: string,
  ) {
    return this.analysis.findOneForUser(
      user._id.toString(),
      user.role,
      analysisId,
    );
  }
}
