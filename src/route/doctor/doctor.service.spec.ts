import { Test, TestingModule } from '@nestjs/testing';
import { DoctorService } from './doctor.service.js';
import { DoctorRepository } from '../../core/database/repository/doctor.repository.js';
import { DoctorPatientRepository } from '../../core/database/repository/doctor-patient.repository.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';
import { AnalysisRepository } from '../../core/database/repository/analysis.repository.js';
import { AppointmentRepository } from '../../core/database/repository/appointment.repository.js';
import { ReportRepository } from '../../core/database/repository/report.repository.js';

describe('DoctorService', () => {
  let service: DoctorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorService,
        { provide: DoctorRepository, useValue: {} },
        { provide: DoctorPatientRepository, useValue: {} },
        { provide: UserRepository, useValue: {} },
        { provide: AnalysisRepository, useValue: {} },
        { provide: AppointmentRepository, useValue: {} },
        { provide: ReportRepository, useValue: {} },
      ],
    }).compile();

    service = module.get<DoctorService>(DoctorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
