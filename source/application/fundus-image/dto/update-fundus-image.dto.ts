import { PartialType } from '@nestjs/swagger';
import { CreateFundusImageDto } from './create-fundus-image.dto.js';

export class UpdateFundusImageDto extends PartialType(CreateFundusImageDto) {}
