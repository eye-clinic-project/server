import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AccessService } from './access.service.js';
import { SystemRoleEnum } from '../enum/security.enum.js';

const user = (role: SystemRoleEnum) => ({ _id: new Types.ObjectId(), role }) as any;

describe('AccessService', () => {
  const assignments = { isActiveAssignment: vi.fn(), activePatientIds: vi.fn() };
  const service = new AccessService(assignments as any);
  beforeEach(() => vi.resetAllMocks());

  it('patients can only access their own data (FR4.1)', async () => {
    const patient = user(SystemRoleEnum.PATIENT);
    await expect(service.canAccessPatient(patient, patient._id)).resolves.toBe(true);
    await expect(service.canAccessPatient(patient, new Types.ObjectId())).resolves.toBe(false);
  });

  it('doctors only access actively assigned patients (FR2.4)', async () => {
    const doctor = user(SystemRoleEnum.DOCTOR);
    assignments.isActiveAssignment.mockResolvedValueOnce({ _id: 1 }).mockResolvedValueOnce(null);
    await expect(service.canAccessPatient(doctor, new Types.ObjectId())).resolves.toBe(true);
    await expect(service.assertCanAccessPatient(doctor, new Types.ObjectId())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('only a treating doctor may write clinical data', async () => {
    await expect(service.assertTreatingDoctor(user(SystemRoleEnum.ADMIN), new Types.ObjectId())).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('scopes list queries by role', async () => {
    const ids = [new Types.ObjectId()];
    assignments.activePatientIds.mockResolvedValue(ids);
    const patient = user(SystemRoleEnum.PATIENT);
    await expect(service.patientFilter(user(SystemRoleEnum.ADMIN))).resolves.toEqual({});
    await expect(service.patientFilter(patient)).resolves.toEqual({ patient: patient._id });
    await expect(service.patientFilter(user(SystemRoleEnum.DOCTOR))).resolves.toEqual({ patient: { $in: ids } });
  });

  it('missing documents are 404, foreign ones 403', async () => {
    const patient = user(SystemRoleEnum.PATIENT);
    await expect(service.assertDocumentAccess(patient, null, 'Report')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.assertDocumentAccess(patient, { patient: new Types.ObjectId() })).rejects.toBeInstanceOf(ForbiddenException);
  });
});
