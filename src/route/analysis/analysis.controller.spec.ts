import { Test, TestingModule } from '@nestjs/testing';
import { AnalysisController } from './analysis.controller.js';
import { AnalysisService } from './analysis.service.js';

describe('AnalysisController', () => {
  let controller: AnalysisController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [AnalysisService],
    }).compile();

    controller = module.get<AnalysisController>(AnalysisController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
