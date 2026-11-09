import { Test, TestingModule } from '@nestjs/testing';
import { DoctorPatientService } from './doctor-patient.service.js';

describe('DoctorPatientService', () => {
  let service: DoctorPatientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DoctorPatientService],
    }).compile();

    service = module.get<DoctorPatientService>(DoctorPatientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
