import { Test, TestingModule } from '@nestjs/testing';
import { PatientService } from './patient.service.js';
import { AnalysisRepository } from '../../core/database/repository/analysis.repository.js';
import { AppointmentRepository } from '../../core/database/repository/appointment.repository.js';
import { DoctorPatientRepository } from '../../core/database/repository/doctor-patient.repository.js';
import { PatientRepository } from '../../core/database/repository/patient.repository.js';
import { ReportRepository } from '../../core/database/repository/report.repository.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';
import { ForbiddenException } from '@nestjs/common';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import { Types } from 'mongoose';

describe('PatientService', () => {
  let service: PatientService;
  const patientProfiles = { findByUserId: vi.fn() };
  const doctorPatients = { findDoctorsByPatient: vi.fn() };
  const users = { findHydratedById: vi.fn() };
  const analyses = { findByPatient: vi.fn() };
  const appointments = { findByPatient: vi.fn() };
  const reports = { findByPatient: vi.fn() };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientService,
        { provide: PatientRepository, useValue: patientProfiles },
        { provide: DoctorPatientRepository, useValue: doctorPatients },
        { provide: UserRepository, useValue: users },
        { provide: AnalysisRepository, useValue: analyses },
        { provide: AppointmentRepository, useValue: appointments },
        { provide: ReportRepository, useValue: reports },
      ],
    }).compile();

    service = module.get<PatientService>(PatientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects medical record requests for non-patient accounts', async () => {
    const userId = new Types.ObjectId();
    users.findHydratedById.mockResolvedValue({ role: UserRoleEnum.DOCTOR });

    await expect(service.getMedicalRecords(userId)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(analyses.findByPatient).not.toHaveBeenCalled();
  });

  it('loads records only for the authenticated patient', async () => {
    const userId = new Types.ObjectId();
    users.findHydratedById.mockResolvedValue({ role: UserRoleEnum.PATIENT });
    analyses.findByPatient.mockResolvedValue([]);
    appointments.findByPatient.mockResolvedValue([]);
    reports.findByPatient.mockResolvedValue([]);
    doctorPatients.findDoctorsByPatient.mockResolvedValue([]);

    await expect(service.getMedicalRecords(userId)).resolves.toEqual({
      analyses: [],
      appointments: [],
      reports: [],
      doctors: [],
    });
    expect(analyses.findByPatient).toHaveBeenCalledWith(userId);
    expect(appointments.findByPatient).toHaveBeenCalledWith(userId);
    expect(reports.findByPatient).toHaveBeenCalledWith(userId);
    expect(doctorPatients.findDoctorsByPatient).toHaveBeenCalledWith(userId);
  });
});
