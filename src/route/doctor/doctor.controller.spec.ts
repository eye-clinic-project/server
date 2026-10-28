
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DoctorController } from './doctor.controller.js';
import { DoctorService } from './doctor.service.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';

describe('DoctorController', () => {
  let controller: DoctorController;

  const doctorService = {
    findAll: vi.fn(),
    findProfile: vi.fn(),
    createProfile: vi.fn(),
    updateProfile: vi.fn(),
    findAssignedPatients: vi.fn(),
    assignPatient: vi.fn(),
    unassignPatient: vi.fn(),
    getAssignedPatientRecords: vi.fn(),
    getDoctorAppointments: vi.fn(),
  };

  const user = {
    _id: { toString: () => 'doctor-1' },
    role: UserRoleEnum.DOCTOR,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new DoctorController(
      doctorService as unknown as DoctorService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all doctors', async () => {
      const result = [{ _id: 'doctor-1' }];
      doctorService.findAll.mockResolvedValue(result);

      await expect(controller.findAll()).resolves.toEqual(result);
      expect(doctorService.findAll).toHaveBeenCalledOnce();
    });
  });

  describe('findMyProfile', () => {
    it('should find the current doctor profile', async () => {
      const result = { _id: 'profile-1' };
      doctorService.findProfile.mockResolvedValue(result);

      await expect(controller.findMyProfile(user as any)).resolves.toEqual(
        result,
      );

      expect(doctorService.findProfile).toHaveBeenCalledWith('doctor-1');
    });
  });

  describe('createMyProfile', () => {
    it('should create a profile for the current doctor', async () => {
      const dto = {
        clinicName: 'My Clinic',
        clinicAddress: 'Cairo',
      };
      const result = { _id: 'profile-1' };

      doctorService.createProfile.mockResolvedValue(result);

      await expect(
        controller.createMyProfile(user as any, dto as any),
      ).resolves.toEqual(result);

      expect(doctorService.createProfile).toHaveBeenCalledWith(
        'doctor-1',
        dto,
      );
    });
  });

  describe('updateMyProfile', () => {
    it('should update the current doctor profile', async () => {
      const dto = { clinicName: 'Updated Clinic' };
      const result = { _id: 'profile-1', ...dto };

      doctorService.updateProfile.mockResolvedValue(result);

      await expect(
        controller.updateMyProfile(user as any, dto as any),
      ).resolves.toEqual(result);

      expect(doctorService.updateProfile).toHaveBeenCalledWith(
        'doctor-1',
        dto,
      );
    });
  });

  describe('findAssignedPatients', () => {
    it('should return patients assigned to the current doctor', async () => {
      const result = [{ _id: 'patient-1' }];
      doctorService.findAssignedPatients.mockResolvedValue(result);

      await expect(
        controller.findAssignedPatients(user as any),
      ).resolves.toEqual(result);

      expect(
        doctorService.findAssignedPatients,
      ).toHaveBeenCalledWith('doctor-1');
    });
  });

  describe('assignPatient', () => {
    it('should assign a patient to the current doctor', async () => {
      const result = { doctor: 'doctor-1', patient: 'patient-1' };
      doctorService.assignPatient.mockResolvedValue(result);

      await expect(
        controller.assignPatient(user as any, 'patient-1'),
      ).resolves.toEqual(result);

      expect(doctorService.assignPatient).toHaveBeenCalledWith(
        'doctor-1',
        'patient-1',
      );
    });
  });

  describe('unassignPatient', () => {
    it('should unassign a patient from the current doctor', async () => {
      doctorService.unassignPatient.mockResolvedValue({ removed: true });

      await expect(
        controller.unassignPatient(user as any, 'patient-1'),
      ).resolves.toEqual({ removed: true });

      expect(doctorService.unassignPatient).toHaveBeenCalledWith(
        'doctor-1',
        'patient-1',
      );
    });
  });

  describe('getPatientRecords', () => {
    it('should return records for an assigned patient', async () => {
      const result = {
        patient: { _id: 'patient-1' },
        analyses: [],
        appointments: [],
        reports: [],
      };

      doctorService.getAssignedPatientRecords.mockResolvedValue(result);

      await expect(
        controller.getPatientRecords(user as any, 'patient-1'),
      ).resolves.toEqual(result);

      expect(
        doctorService.getAssignedPatientRecords,
      ).toHaveBeenCalledWith('doctor-1', 'patient-1');
    });
  });

  describe('getAppointments', () => {
    it('should return the current doctor appointments', async () => {
      const result = [{ _id: 'appointment-1' }];
      doctorService.getDoctorAppointments.mockResolvedValue(result);

      await expect(
        controller.getAppointments(user as any),
      ).resolves.toEqual(result);

      expect(doctorService.getDoctorAppointments).toHaveBeenCalledWith(
        'doctor-1',
      );
    });
  });

  describe('findOne', () => {
    it('should find a doctor by ID', async () => {
      const result = { _id: 'profile-1' };
      doctorService.findProfile.mockResolvedValue(result);

      await expect(controller.findOne('doctor-1')).resolves.toEqual(result);

      expect(doctorService.findProfile).toHaveBeenCalledWith('doctor-1');
    });
  });
});
