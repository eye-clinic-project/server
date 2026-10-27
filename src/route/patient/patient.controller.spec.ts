import { Test, TestingModule } from '@nestjs/testing';
import { PatientController } from './patient.controller.js';
import { PatientService } from './patient.service.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/role.guard.js';

describe('PatientController', () => {
  let controller: PatientController;

  beforeEach(async () => {
    const builder = Test.createTestingModule({
      controllers: [PatientController],
      providers: [{ provide: PatientService, useValue: {} }],
    });
    builder.overrideGuard(AuthGuard).useValue({ canActivate: vi.fn(() => true) });
    builder.overrideGuard(RolesGuard).useValue({ canActivate: vi.fn(() => true) });
    const module: TestingModule = await builder.compile();

    controller = module.get<PatientController>(PatientController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
