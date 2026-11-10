import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { DoctorPatientRepository } from '../../database/repository/doctor-patient.repository.js';
import type { HUserDocument } from '../../database/model/user.model.js';
import { SystemRoleEnum } from '../enum/security.enum.js';

/**
 * Central access-control rules (FR2.3, FR2.4, FR4.1, NFR10):
 *  - admin:   everything
 *  - doctor:  only patients with an ACTIVE assignment to them
 *  - patient: only their own data
 */
@Injectable()
export class AccessService {
  constructor(private readonly assignments: DoctorPatientRepository) {}

  isAdmin(user: HUserDocument) {
    return user.role === SystemRoleEnum.ADMIN;
  }

  async canAccessPatient(user: HUserDocument, patientId: Types.ObjectId): Promise<boolean> {
    switch (user.role) {
      case SystemRoleEnum.ADMIN:
        return true;
      case SystemRoleEnum.PATIENT:
        return user._id.equals(patientId);
      case SystemRoleEnum.DOCTOR:
        return !!(await this.assignments.isActiveAssignment(user._id, patientId));
      default:
        return false;
    }
  }

  async assertCanAccessPatient(user: HUserDocument, patientId: Types.ObjectId) {
    if (!(await this.canAccessPatient(user, patientId))) {
      throw new ForbiddenException('You do not have access to this patient');
    }
  }

  /** For write operations on clinical data: the user must be a doctor assigned to the patient. */
  async assertTreatingDoctor(user: HUserDocument, patientId: Types.ObjectId) {
    if (user.role !== SystemRoleEnum.DOCTOR) {
      throw new ForbiddenException('Only the treating doctor can do this');
    }
    if (!(await this.assignments.isActiveAssignment(user._id, patientId))) {
      throw new ForbiddenException('This patient is not assigned to you');
    }
  }

  /**
   * Mongo filter limiting a query on a collection with a `patient` field to what the
   * user may see. Returns {} for admins.
   */
  async patientFilter(user: HUserDocument): Promise<Record<string, unknown>> {
    switch (user.role) {
      case SystemRoleEnum.ADMIN:
        return {};
      case SystemRoleEnum.PATIENT:
        return { patient: user._id };
      case SystemRoleEnum.DOCTOR:
        return { patient: { $in: await this.assignments.activePatientIds(user._id) } };
      default:
        return { _id: null };
    }
  }

  /** Throws 404 when the document is missing and 403 when it belongs to another patient. */
  async assertDocumentAccess<T extends { patient: Types.ObjectId | { _id: Types.ObjectId } }>(
    user: HUserDocument,
    doc: T | null | undefined,
    label = 'Resource',
  ): Promise<T> {
    if (!doc) throw new NotFoundException(`${label} not found`);
    const patient = doc.patient as any;
    const patientId: Types.ObjectId = patient?._id ?? patient;
    await this.assertCanAccessPatient(user, patientId);
    return doc;
  }
}
