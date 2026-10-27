import { Test, TestingModule } from '@nestjs/testing';
import { ReportService } from './report.service.js';
import { ReportRepository } from '../../core/database/repository/report.repository.js';
import { DoctorService } from '../doctor/doctor.service.js';

describe('ReportService', () => {
  let service: ReportService;
  const reports = {
    findByDoctor: vi.fn(),
    findByDoctorAndId: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  };
  const doctors = { verifyReportContext: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        { provide: ReportRepository, useValue: reports },
        { provide: DoctorService, useValue: doctors },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('verifies the doctor-patient-analysis relationship before creating a report', async () => {
    const doctorId = '507f1f77bcf86cd799439011';
    const patientId = '507f1f77bcf86cd799439012';
    const analysisId = '507f1f77bcf86cd799439013';
    const saved = { _id: 'report-id' };
    reports.create.mockResolvedValue(saved);

    await expect(
      service.create(doctorId, {
        patientId,
        analysisId,
        title: 'Clinical assessment',
        content: 'Findings',
      }),
    ).resolves.toBe(saved);

    expect(doctors.verifyReportContext).toHaveBeenCalledWith(
      expect.objectContaining({ _bsontype: 'ObjectId' }),
      expect.objectContaining({ _bsontype: 'ObjectId' }),
      expect.objectContaining({ _bsontype: 'ObjectId' }),
    );
    expect(reports.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        doctor: expect.objectContaining({ _bsontype: 'ObjectId' }),
        patient: expect.objectContaining({ _bsontype: 'ObjectId' }),
        analysis: expect.objectContaining({ _bsontype: 'ObjectId' }),
        title: 'Clinical assessment',
      }),
    });
  });
});
