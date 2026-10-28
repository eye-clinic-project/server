
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DoctorService } from './doctor.service.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';

describe('DoctorService', () => {
  let service: DoctorService;

  const doctors = {
    find: vi.fn(),
    findById: vi.fn(),
    findByUserId: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
  };

  const doctorPatients = {
    findByDoctorAndPatient: vi.fn(),
    create: vi.fn(),
    removeAssignment: vi.fn(),
    findPatientsByDoctor: vi.fn(),
    isAssigned: vi.fn(),
  };

  const users = {
    findHydratedById: vi.fn(),
  };

  const analyses = {
    findByPatient: vi.fn(),
    findByPatientAndId: vi.fn(),
  };

  const appointments = {
    findByDoctor: vi.fn(),
    findByDoctorAndPatient: vi.fn(),
  };

  const reports = {
    findByDoctorAndPatient: vi.fn(),
  };

  const utilService = {
    toObjectId: vi.fn((id: string) => id as any),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new DoctorService(
      doctors as any,
      doctorPatients as any,
      users as any,
      analyses as any,
      appointments as any,
      reports as any,
      utilService as any,
    );
  });

  describe('findAll', () => {
    it('should return all doctors', async () => {
      const result = [{ _id: 'doctor-1' }];
      doctors.find.mockResolvedValue(result);

      await expect(service.findAll()).resolves.toEqual(result);

      expect(doctors.find).toHaveBeenCalledWith({
        options: {
          populate: [{ path: 'user', select: 'name email city' }],
        },
      });
    });
  });

  describe('findProfile', () => {
    it('should find a profile by doctor ID', async () => {
      const profile = { _id: 'doctor-1' };
      doctors.findById.mockResolvedValue(profile);

      await expect(service.findProfile('doctor-1')).resolves.toEqual(profile);

      expect(doctors.findById).toHaveBeenCalled();
      expect(doctors.findByUserId).not.toHaveBeenCalled();
    });

    it('should fall back to user ID when the first lookup fails', async () => {
      const profile = { _id: 'profile-1' };
      doctors.findById.mockResolvedValue(null);
      doctors.findByUserId.mockResolvedValue(profile);

      await expect(service.findProfile('user-1')).resolves.toEqual(profile);

      expect(doctors.findByUserId).toHaveBeenCalledWith('user-1');
    });

    it('should throw when the profile does not exist', async () => {
      doctors.findById.mockResolvedValue(null);
      doctors.findByUserId.mockResolvedValue(null);

      await expect(service.findProfile('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createProfile', () => {
    const dto = {
      clinicName: '  My Clinic  ',
      clinicAddress: '  Cairo  ',
      specialty: '  Eye Doctor  ',
      licenseNumber: '  LIC-123  ',
    };

    it('should create a doctor profile', async () => {
      users.findHydratedById.mockResolvedValue({
        role: UserRoleEnum.DOCTOR,
      });
      doctors.findByUserId.mockResolvedValue(null);

      const created = { _id: 'profile-1' };
      doctors.create.mockResolvedValue(created);

      await expect(
        service.createProfile('doctor-1', dto as any),
      ).resolves.toEqual(created);

      expect(doctors.create).toHaveBeenCalledWith({
        data: {
          user: 'doctor-1',
          clinicName: 'My Clinic',
          clinicAddress: 'Cairo',
          specialty: 'Eye Doctor',
          licenseNumber: 'LIC-123',
        },
      });
    });

    it('should reject a non-doctor account', async () => {
      users.findHydratedById.mockResolvedValue({
        role: UserRoleEnum.PATIENT,
      });

      await expect(
        service.createProfile('patient-1', dto as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject when the profile already exists', async () => {
      users.findHydratedById.mockResolvedValue({
        role: UserRoleEnum.DOCTOR,
      });
      doctors.findByUserId.mockResolvedValue({ _id: 'existing-profile' });

      await expect(
        service.createProfile('doctor-1', dto as any),
      ).rejects.toThrow(ConflictException);

      expect(doctors.create).not.toHaveBeenCalled();
    });

    it('should convert duplicate-key errors into ConflictException', async () => {
      users.findHydratedById.mockResolvedValue({
        role: UserRoleEnum.DOCTOR,
      });
      doctors.findByUserId.mockResolvedValue(null);
      doctors.create.mockRejectedValue({ code: 11000 });

      await expect(
        service.createProfile('doctor-1', dto as any),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateProfile', () => {
    it('should update an existing profile', async () => {
      doctors.findByUserId.mockResolvedValue({ _id: 'profile-1' });

      const updated = { _id: 'profile-1', clinicName: 'Updated Clinic' };
      doctors.findOneAndUpdate.mockResolvedValue(updated);

      await expect(
        service.updateProfile('doctor-1', {
          clinicName: '  Updated Clinic  ',
        } as any),
      ).resolves.toEqual(updated);

      expect(doctors.findOneAndUpdate).toHaveBeenCalledWith({
        filter: { user: 'doctor-1' },
        update: { $set: { clinicName: 'Updated Clinic' } },
        populate: [{ path: 'user', select: 'name email city' }],
      });
    });

    it('should throw when the profile does not exist', async () => {
      doctors.findByUserId.mockResolvedValue(null);

      await expect(
        service.updateProfile('doctor-1', {} as any),
      ).rejects.toThrow(NotFoundException);

      expect(doctors.findOneAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('assignPatient', () => {
    it('should assign a patient to a doctor', async () => {
      users.findHydratedById
        .mockResolvedValueOnce({ role: UserRoleEnum.DOCTOR })
        .mockResolvedValueOnce({ role: UserRoleEnum.PATIENT });

      doctorPatients.findByDoctorAndPatient.mockResolvedValue(null);

      const relation = { doctor: 'doctor-1', patient: 'patient-1' };
      doctorPatients.create.mockResolvedValue(relation);

      await expect(
        service.assignPatient('doctor-1', 'patient-1'),
      ).resolves.toEqual(relation);

      expect(doctorPatients.create).toHaveBeenCalledWith({
        data: { doctor: 'doctor-1', patient: 'patient-1' },
      });
    });

    it('should reject when the doctor account is invalid', async () => {
      users.findHydratedById.mockResolvedValue({
        role: UserRoleEnum.PATIENT,
      });

      await expect(
        service.assignPatient('doctor-1', 'patient-1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject a missing or non-patient account', async () => {
      users.findHydratedById
        .mockResolvedValueOnce({ role: UserRoleEnum.DOCTOR })
        .mockResolvedValueOnce(null);

      await expect(
        service.assignPatient('doctor-1', 'patient-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject a duplicate assignment', async () => {
      users.findHydratedById
        .mockResolvedValueOnce({ role: UserRoleEnum.DOCTOR })
        .mockResolvedValueOnce({ role: UserRoleEnum.PATIENT });

      doctorPatients.findByDoctorAndPatient.mockResolvedValue({
        _id: 'relation-1',
      });

      await expect(
        service.assignPatient('doctor-1', 'patient-1'),
      ).rejects.toThrow(ConflictException);

      expect(doctorPatients.create).not.toHaveBeenCalled();
    });
  });

  describe('unassignPatient', () => {
    it('should remove an assignment', async () => {
      doctorPatients.removeAssignment.mockResolvedValue({ _id: 'relation-1' });

      await expect(
        service.unassignPatient('doctor-1', 'patient-1'),
      ).resolves.toEqual({ removed: true });
    });

    it('should throw when the assignment does not exist', async () => {
      doctorPatients.removeAssignment.mockResolvedValue(null);

      await expect(
        service.unassignPatient('doctor-1', 'patient-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('assertAssignedPatient', () => {
    it('should reject patients not assigned to the doctor', async () => {
      doctorPatients.isAssigned.mockResolvedValue(false);

      await expect(
        service.assertAssignedPatient(
          'doctor-1' as any,
          'patient-1' as any,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow an assigned patient', async () => {
      doctorPatients.isAssigned.mockResolvedValue(true);

      await expect(
        service.assertAssignedPatient(
          'doctor-1' as any,
          'patient-1' as any,
        ),
      ).resolves.toBeUndefined();
    });
  });
});
