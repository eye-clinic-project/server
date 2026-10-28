import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from '../../common/decorator/auth.decorator.js';
import { User } from '../../common/decorator/user.decorator.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import type { HUserDocument } from '../../core/database/model/user.model.js';
import { AnalysisService } from './analysis.service.js';
import { th } from 'zod/v4/locales/index.js';

@Controller('analysis')
@ApiTags('Analysis')
@Auth([UserRoleEnum.DOCTOR, UserRoleEnum.PATIENT])
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get()
  findAll(@User() user: HUserDocument) {
    return this.analysisService.findForUser(user._id.toString(), user.role);
  }

  @Get(':analysisId')
  findOne(
    @User() user: HUserDocument,
    @Param('analysisId') analysisId: string,
  ) {
    return this.analysisService.findOneForUser(
      user._id.toString(),
      user.role,
      analysisId,
    );
  }

  @Post()
  SendFundusImageToFastAPI(){
    return this.analysisService.fundusImage()
  }
}
