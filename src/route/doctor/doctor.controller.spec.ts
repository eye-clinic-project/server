import { Test, TestingModule } from '@nestjs/testing';
import { DoctorController } from './doctor.controller.js';
import { DoctorService } from './doctor.service.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/role.guard.js';

describe('DoctorController', () => {
  let controller: DoctorController;

  beforeEach(async () => {
    const builder = Test.createTestingModule({
      controllers: [DoctorController],
      providers: [{ provide: DoctorService, useValue: {} }],
    });
    builder.overrideGuard(AuthGuard).useValue({ canActivate: vi.fn(() => true) });
    builder.overrideGuard(RolesGuard).useValue({ canActivate: vi.fn(() => true) });
    const module: TestingModule = await builder.compile();

    controller = module.get<DoctorController>(DoctorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
