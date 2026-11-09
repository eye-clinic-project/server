import { Test, TestingModule } from '@nestjs/testing';
import { DoctorPatientController } from './doctor-patient.controller.js';
import { DoctorPatientService } from './doctor-patient.service.js';

describe('DoctorPatientController', () => {
  let controller: DoctorPatientController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorPatientController],
      providers: [DoctorPatientService],
    }).compile();

    controller = module.get<DoctorPatientController>(DoctorPatientController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
