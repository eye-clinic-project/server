import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Auth } from '../../../common/decorator/auth.decorator.js';
import { User } from '../../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../../common/enum/security.enum.js';
import type { HUserDocument } from '../../../core/database/model/user.model.js';
import { GraphQLJSON } from '../../../common/graphql/json.scalar.js';
import { CreateReportDto } from '../dto/create-report.dto.js';
import { UpdateReportDto } from '../dto/update-report.dto.js';
import { ReportService } from '../report.service.js';

@Resolver()
@Auth([UserRoleEnum.DOCTOR])
export class ReportResolver {
  constructor(private readonly reports: ReportService) {}

  @Query(() => GraphQLJSON, { name: 'myReports' })
  findAll(@User() user: HUserDocument) {
    return this.reports.findAll(user._id.toString());
  }

  @Query(() => GraphQLJSON, { name: 'report' })
  findOne(
    @User() user: HUserDocument,
    @Args('reportId', { type: () => ID }) reportId: string,
  ) {
    return this.reports.findOne(user._id.toString(), reportId);
  }

  @Mutation(() => GraphQLJSON)
  createReport(
    @User() user: HUserDocument,
    @Args('input', { type: () => GraphQLJSON }) input: CreateReportDto,
  ) {
    return this.reports.create(user._id.toString(), input);
  }

  @Mutation(() => GraphQLJSON)
  updateReport(
    @User() user: HUserDocument,
    @Args('reportId', { type: () => ID }) reportId: string,
    @Args('input', { type: () => GraphQLJSON }) input: UpdateReportDto,
  ) {
    return this.reports.update(user._id.toString(), reportId, input);
  }

  @Mutation(() => GraphQLJSON)
  removeReport(
    @User() user: HUserDocument,
    @Args('reportId', { type: () => ID }) reportId: string,
  ) {
    return this.reports.remove(user._id.toString(), reportId);
  }
}