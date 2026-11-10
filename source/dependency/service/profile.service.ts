import { ConflictException, Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { PatientRepository } from '../../database/repository/patient.repository.js';
import { DoctorRepository } from '../../database/repository/doctor.repository.js';
import type { IDoctor, IPatient } from '../interface/database-schema.interface.js';
import { UtilService } from './util.service.js';
import { UserRepository } from '../../database/repository/user.repository.js';
import { NotifierService } from './notifier.service.js';
import { SystemRoleEnum } from '../enum/security.enum.js';
import { DoctorVerificationStatus, NotificationType } from '../enum/database.enum.js';

export const isDuplicateKeyError = (error: unknown): error is { code: number; keyPattern?: Record<string, unknown> } =>
  typeof error === 'object' && error !== null && 'code' in error && (error as { code: unknown }).code === 11000;

/** Creates the role-specific profile document that goes with each user. */
@Injectable()
export class ProfileService {
  constructor(
    private readonly patients: PatientRepository,
    private readonly doctors: DoctorRepository,
    private readonly util: UtilService,
    private readonly users: UserRepository,
    private readonly notifier: NotifierService,
  ) {}

  async createPatientProfile(userId: Types.ObjectId, data: Partial<Omit<IPatient, 'user' | 'medicalRecordNumber'>> = {}) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await this.patients.create({
          data: { ...data, user: userId, medicalRecordNumber: this.util.createMedicalRecordNumber() },
        });
      } catch (error) {
        if (isDuplicateKeyError(error) && error.keyPattern?.medicalRecordNumber) continue;
        throw error;
      }
    }
    throw new ConflictException('Could not allocate a patient ID, please retry');
  }

  async createDoctorProfile(userId: Types.ObjectId, data: Pick<IDoctor, 'clinicName' | 'clinicAddress'> & Partial<IDoctor>) {
    try {
      const profile = await this.doctors.create({
        data: {
          ...data,
          user: userId,
          verificationStatus: DoctorVerificationStatus.PENDING,
          verificationSubmittedAt: new Date(),
        },
      });
      await this.notifyAdminsOfLicenseReview(userId);
      return profile;
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictException('This license number is already registered');
      }
      throw error;
    }
  }

  /** Tells every active admin that a doctor's license is waiting for review. Never fails the caller. */
  async notifyAdminsOfLicenseReview(doctorUserId: Types.ObjectId) {
    try {
      const [doctor, admins] = await Promise.all([
        this.users.findById({ _id: doctorUserId, options: { lean: true } }),
        this.users.find({
          filter: { role: SystemRoleEnum.ADMIN, isActive: { $ne: false } },
          projection: { _id: 1 },
          options: { lean: true },
        }),
      ]);
      await Promise.all(
        admins.map((admin: { _id: Types.ObjectId }) =>
          this.notifier.notify({
            recipient: admin._id,
            type: NotificationType.SYSTEM,
            title: 'Doctor license waiting for review',
            body: `${(doctor as { name?: string } | null)?.name ?? 'A doctor'} submitted a medical license for approval.`,
            link: '/admin/doctors',
            resourceId: doctorUserId,
          }),
        ),
      );
    } catch {
      // Notifications are best effort; the doctor still appears in the admin review list.
    }
  }
}
