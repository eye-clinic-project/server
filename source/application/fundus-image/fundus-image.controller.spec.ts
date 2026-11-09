import { Test, TestingModule } from '@nestjs/testing';
import { FundusImageController } from './fundus-image.controller.js';
import { FundusImageService } from './fundus-image.service.js';

describe('FundusImageController', () => {
  let controller: FundusImageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FundusImageController],
      providers: [FundusImageService],
    }).compile();

    controller = module.get<FundusImageController>(FundusImageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
