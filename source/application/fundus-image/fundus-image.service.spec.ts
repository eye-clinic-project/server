import { Test, TestingModule } from '@nestjs/testing';
import { FundusImageService } from './fundus-image.service.js';

describe('FundusImageService', () => {
  let service: FundusImageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FundusImageService],
    }).compile();

    service = module.get<FundusImageService>(FundusImageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
