import { PartialType } from '@nestjs/mapped-types';
import { CreateAnalysisDto } from './create-analysis.dto.js';

export class UpdateAnalysisDto extends PartialType(CreateAnalysisDto) {}
