import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import { AnalysisRepository } from '../../core/database/repository/analysis.repository.js';
import { AppointmentRepository } from '../../core/database/repository/appointment.repository.js';
import { DoctorPatientRepository } from '../../core/database/repository/doctor-patient.repository.js';
import { PatientRepository } from '../../core/database/repository/patient.repository.js';
import { ReportRepository } from '../../core/database/repository/report.repository.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import { UpdatePatientDto } from './dto/update-patient.dto.js';

@Injectable()
export class PatientService {
  constructor(
    private readonly patients: PatientRepository,
    private readonly doctorPatients: DoctorPatientRepository,
    private readonly users: UserRepository,
    private readonly analyses: AnalysisRepository,
    private readonly appointments: AppointmentRepository,
    private readonly reports: ReportRepository,
  ) {}

  async findProfile(userId: Types.ObjectId) {
    const user = await this.requirePatient(userId);
    const profile = await this.patients.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }
    return { ...profile.toObject(), user };
  }

  async createProfile(userId: Types.ObjectId, dto: CreatePatientDto) {
    await this.requirePatient(userId);
    if (await this.patients.findByUserId(userId)) {
      throw new ConflictException('Patient profile already exists');
    }

    try {
      return await this.patients.create({
        data: {
          user: userId,
          dateOfBirth: dto.dateOfBirth,
          gender: dto.gender,
          emergencyContact: dto.emergencyContact?.trim(),
        },
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException('Patient profile already exists');
      }
      throw error;
    }
  }

  async updateProfile(userId: Types.ObjectId, dto: UpdatePatientDto) {
    await this.requirePatient(userId);
    if (
      dto.dateOfBirth === undefined &&
      dto.gender === undefined &&
      dto.emergencyContact === undefined
    ) {
      throw new BadRequestException('At least one patient field is required');
    }

    const profile = await this.patients.findOneAndUpdate({
      filter: { user: userId },
      update: {
        $set: {
          ...(dto.dateOfBirth !== undefined && {
            dateOfBirth: dto.dateOfBirth,
          }),
          ...(dto.gender !== undefined && { gender: dto.gender }),
          ...(dto.emergencyContact !== undefined && {
            emergencyContact: dto.emergencyContact.trim(),
          }),
        },
      },
      populate: [{ path: 'user', select: 'name email city role' }],
    });

    if (!profile) {
      throw new NotFoundException('Patient profile not found');
    }
    return profile;
  }

  async getMedicalRecords(userId: Types.ObjectId) {
    await this.requirePatient(userId);
    const [analyses, appointments, reports, doctors] = await Promise.all([
      this.analyses.findByPatient(userId),
      this.appointments.findByPatient(userId),
      this.reports.findByPatient(userId),
      this.doctorPatients.findDoctorsByPatient(userId),
    ]);

    return { analyses, appointments, reports, doctors };
  }

  private async requirePatient(userId: Types.ObjectId) {
    const user = await this.users.findHydratedById(userId);
    if (!user) {
      throw new NotFoundException('Patient account not found');
    }
    if (user.role !== UserRoleEnum.PATIENT) {
      throw new ForbiddenException('A patient account is required');
    }
    return user;
  }
}
