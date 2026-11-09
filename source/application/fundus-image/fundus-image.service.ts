import { Injectable } from '@nestjs/common';
import { CreateFundusImageDto } from './dto/create-fundus-image.dto.js';
import { UpdateFundusImageDto } from './dto/update-fundus-image.dto.js';

@Injectable()
export class FundusImageService {
  create(createFundusImageDto: CreateFundusImageDto) {
    return 'This action adds a new fundusImage';
  }

  findAll() {
    return `This action returns all fundusImage`;
  }

  findOne(id: number) {
    return `This action returns a #${id} fundusImage`;
  }

  update(id: number, updateFundusImageDto: UpdateFundusImageDto) {
    return `This action updates a #${id} fundusImage`;
  }

  remove(id: number) {
    return `This action removes a #${id} fundusImage`;
  }
}
