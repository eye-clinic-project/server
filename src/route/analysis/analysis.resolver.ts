import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphQLJSON } from '../../common/graphql/json.scalar.js';
import { AnalysisService } from './analysis.service.js';
import { CreateAnalysisDto } from './dto/create-analysis.dto.js';
import { UpdateAnalysisDto } from './dto/update-analysis.dto.js';

@Resolver()
export class AnalysisResolver {
  constructor(private readonly analysis: AnalysisService) {}

  @Mutation(() => GraphQLJSON)
  createAnalysis() {
    return this.analysis.create(new CreateAnalysisDto());
  }

  @Query(() => GraphQLJSON, { name: 'analyses' })
  findAll() {
    return this.analysis.findAll();
  }

  @Query(() => GraphQLJSON, { name: 'analysis' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.analysis.findOne(id);
  }

  @Mutation(() => GraphQLJSON)
  updateAnalysis(@Args('id', { type: () => Int }) id: number) {
    return this.analysis.update(id, new UpdateAnalysisDto());
  }

  @Mutation(() => GraphQLJSON)
  removeAnalysis(@Args('id', { type: () => Int }) id: number) {
    return this.analysis.remove(id);
  }
}