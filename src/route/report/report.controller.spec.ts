import { Test, TestingModule } from '@nestjs/testing';
import { ReportController } from './report.controller.js';
import { ReportService } from './report.service.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/role.guard.js';

describe('ReportController', () => {
  let controller: ReportController;

  beforeEach(async () => {
    const builder = Test.createTestingModule({
      controllers: [ReportController],
      providers: [{ provide: ReportService, useValue: {} }],
    });
    builder.overrideGuard(AuthGuard).useValue({ canActivate: vi.fn(() => true) });
    builder.overrideGuard(RolesGuard).useValue({ canActivate: vi.fn(() => true) });
    const module: TestingModule = await builder.compile();

    controller = module.get<ReportController>(ReportController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
