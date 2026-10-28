import {
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
import { DoctorRepository } from '../../core/database/repository/doctor.repository.js';
import { ReportRepository } from '../../core/database/repository/report.repository.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';
import { CreateDoctorDto } from './dto/create-doctor.dto.js';
import { UpdateDoctorDto } from './dto/update-doctor.dto.js';
import { UtilService } from '../../common/service/util.service.js';
import { th } from 'zod/v4/locales/index.js';



@Injectable()
export class DoctorService {
  constructor(
    private readonly doctors: DoctorRepository,
    private readonly doctorPatients: DoctorPatientRepository,
    private readonly users: UserRepository,
    private readonly analyses: AnalysisRepository,
    private readonly appointments: AppointmentRepository,
    private readonly reports: ReportRepository,
    private readonly UtilService : UtilService,
  ) {}

  async findAll() {
    return this.doctors.find({
      options: { populate: [{ path: 'user', select: 'name email city' }] },
    });
  }

  async findProfile(doctorId: string) {
    const id = this.UtilService.toObjectId(doctorId);
    const profile =
      (await this.doctors.findById({
        _id: id,
        options: { populate: [{ path: 'user', select: 'name email city' }] },
      })) ?? (await this.doctors.findByUserId(id));
    if (!profile) {
      throw new NotFoundException('Doctor profile not found');
    }
    return profile;
  }

  async createProfile(doctorId: string, dto: CreateDoctorDto) {
    const userObjectId = this.UtilService.toObjectId(doctorId);
    const user = await this.users.findHydratedById(userObjectId);
    if (!user || user.role !== UserRoleEnum.DOCTOR) {
      throw new ForbiddenException('A doctor account is required');
    }

    if (await this.doctors.findByUserId(userObjectId)) {
      throw new ConflictException('Doctor profile already exists');
    }

    try {
      return await this.doctors.create({
        data: {
          user: userObjectId,
          clinicName: dto.clinicName.trim(),
          clinicAddress: dto.clinicAddress.trim(),
          specialty: dto.specialty?.trim(),
          licenseNumber: dto.licenseNumber?.trim(),
        },
      });
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 11000
      ) {
        throw new ConflictException(
          'A doctor profile with this license already exists',
        );
      }
      throw error;
    }
  }

  async updateProfile(doctorId: string, dto: UpdateDoctorDto) {
    const userObjectId = this.UtilService.toObjectId(doctorId);
    const existing = await this.doctors.findByUserId(userObjectId);
    if (!existing) {
      throw new NotFoundException('Doctor profile not found');
    }

    const updated = await this.doctors.findOneAndUpdate({
      filter: { user: userObjectId },
      update: {
        $set: {
          ...(dto.clinicName !== undefined && {
            clinicName: dto.clinicName.trim(),
          }),
          ...(dto.clinicAddress !== undefined && {
            clinicAddress: dto.clinicAddress.trim(),
          }),
          ...(dto.specialty !== undefined && {
            specialty: dto.specialty.trim(),
          }),
          ...(dto.licenseNumber !== undefined && {
            licenseNumber: dto.licenseNumber.trim(),
          }),
        },
      },
      populate: [{ path: 'user', select: 'name email city' }],
    });

    if (!updated) {
      throw new NotFoundException('Doctor profile not found');
    }
    return updated;
  }

  async assignPatient(doctorId: string, patientId: string) {
    const doctorObjectId = this.UtilService.toObjectId(doctorId);
    const patientObjectId = this.UtilService.toObjectId(patientId);
    const doctor = await this.users.findHydratedById(doctorObjectId);
    const patient = await this.users.findHydratedById(patientObjectId);

    if (!doctor || doctor.role !== UserRoleEnum.DOCTOR) {
      throw new ForbiddenException('A doctor account is required');
    }
    if (!patient || patient.role !== UserRoleEnum.PATIENT) {
      throw new NotFoundException('Patient not found');
    }
    if (
      await this.doctorPatients.findByDoctorAndPatient(
        doctorObjectId,
        patientObjectId,
      )
    ) {
      throw new ConflictException('Patient is already assigned to this doctor');
    }

    return this.doctorPatients.create({
      data: { doctor: doctorObjectId, patient: patientObjectId },
    });
  }

  async unassignPatient(doctorId: string, patientId: string) {
    const relation = await this.doctorPatients.removeAssignment(
      this.UtilService.toObjectId(doctorId),
      this.UtilService.toObjectId(patientId),
    );
    if (!relation) {
      throw new NotFoundException('Patient assignment not found');
    }
    return { removed: true };
  }

  async findAssignedPatients(doctorId: string) {
    return this.doctorPatients.findPatientsByDoctor(this.UtilService.toObjectId(doctorId));
  }

  async getAssignedPatientRecords(doctorId: string, patientId: string) {
    const doctorObjectId = this.UtilService.toObjectId(doctorId);
    const patientObjectId = this.UtilService.toObjectId(patientId);
    await this.assertAssignedPatient(doctorObjectId, patientObjectId);

    const patient = await this.users.findHydratedById(patientObjectId);
    if (!patient || patient.role !== UserRoleEnum.PATIENT) {
      throw new NotFoundException('Patient not found');
    }

    const [analyses, appointments, reports] = await Promise.all([
      this.analyses.findByPatient(patientObjectId),
      this.appointments.findByDoctorAndPatient(doctorObjectId, patientObjectId),
      this.reports.findByDoctorAndPatient(doctorObjectId, patientObjectId),
    ]);

    return { patient, analyses, appointments, reports };
  }

  async getDoctorAppointments(doctorId: string) {
    return this.appointments.findByDoctor(this.UtilService.toObjectId(doctorId));
  }

  async assertAssignedPatient(
    doctorId: Types.ObjectId,
    patientId: Types.ObjectId,
  ): Promise<void> {
    if (!(await this.doctorPatients.isAssigned(doctorId, patientId))) {
      throw new ForbiddenException(
        'The patient is not assigned to this doctor',
      );
    }
  }

  async verifyReportContext(
    doctorId: Types.ObjectId,
    patientId: Types.ObjectId,
    analysisId: Types.ObjectId,
  ) {
    await this.assertAssignedPatient(doctorId, patientId);

    const [doctor, patient, analysis] = await Promise.all([
      this.users.findHydratedById(doctorId),
      this.users.findHydratedById(patientId),
      this.analyses.findByPatientAndId(patientId, analysisId),
    ]);

    if (!doctor || doctor.role !== UserRoleEnum.DOCTOR) {
      throw new ForbiddenException('A doctor account is required');
    }
    if (!patient || patient.role !== UserRoleEnum.PATIENT) {
      throw new NotFoundException('Patient not found');
    }
    if (!analysis) {
      throw new NotFoundException('Analysis not found for this patient');
    }
    if (analysis.doctor.toString() !== doctorId.toString()) {
      throw new ForbiddenException(
        'The analysis was not created by this doctor',
      );
    }

    return { doctor, patient, analysis };
  }

}
