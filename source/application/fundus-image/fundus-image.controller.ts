import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FundusImageService } from './fundus-image.service.js';
import { CreateFundusImageDto } from './dto/create-fundus-image.dto.js';
import { UpdateFundusImageDto } from './dto/update-fundus-image.dto.js';

@Controller('fundus-image')
export class FundusImageController {
  constructor(private readonly fundusImageService: FundusImageService) {}

  @Post()
  create(@Body() createFundusImageDto: CreateFundusImageDto) {
    return this.fundusImageService.create(createFundusImageDto);
  }

  @Get()
  findAll() {
    return this.fundusImageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fundusImageService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFundusImageDto: UpdateFundusImageDto) {
    return this.fundusImageService.update(+id, updateFundusImageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fundusImageService.remove(+id);
  }
}
