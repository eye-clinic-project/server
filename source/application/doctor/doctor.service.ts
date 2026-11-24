import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectDisk, StorageDisk, type StoredUpload } from '@nestjs/storage';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Types } from 'mongoose';

import type { ILicenseDocument, IUser } from '../../dependencies/interface/database.interface.js';
import { CreatePatientCommand } from '../patient/cqrs/command/create-patient.command.js';
import { FindPatientByIdQuery } from '../patient/cqrs/query/find-patient-by-id.query.js';
import { CreatePatientDto } from '../patient/dto/create-patient.dto.js';
import { PatientEntity, toPatientEntity } from '../patient/entity/patient.entity.js';
import { AssignPatientCommand } from './cqrs/command/assign-patient.command.js';
import { type ClinicData, UpsertClinicCommand } from './cqrs/command/upsert-clinic.command.js';
import { SubmitLicenseCommand } from './cqrs/command/submit-license.command.js';
import { UnassignPatientCommand } from './cqrs/command/unassign-patient.command.js';
import { GetDoctorProfileQuery } from './cqrs/query/get-doctor-profile.query.js';
import { SearchPatientsForAssignmentQuery } from './cqrs/query/search-patients-for-assignment.query.js';
import { SearchPatientsDto } from './dto/search-patients.dto.js';
import { SubmitLicenseDto } from './dto/submit-license.dto.js';
import { UpdateClinicDto } from './dto/update-clinic.dto.js';
import { DoctorClinicEntity, toDoctorClinicEntity } from './entity/doctor-clinic.entity.js';
import type { PatientSearchPage } from './entity/doctor.type.js';
import { toPatientSearchEntity } from './entity/patient-search.entity.js';
import { toVerificationEntity, VerificationEntity } from './entity/verification.entity.js';
import { DOCTOR_LICENSE_SUBMITTED_EVENT, DoctorLicenseSubmittedEvent } from './event/doctor-license-submitted.event.js';
import { DOCTOR_PATIENT_ASSIGNED_EVENT, DoctorPatientAssignedEvent } from './event/doctor-patient-assigned.event.js';
import { DOCTOR_PATIENT_UNASSIGNED_EVENT, DoctorPatientUnassignedEvent } from './event/doctor-patient-unassigned.event.js';

@Injectable()
export class DoctorService {
  private readonly logger = new Logger(DoctorService.name);

  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventEmitter: EventEmitter2,
    @InjectDisk('private') private readonly disk: StorageDisk,
  ) {}

  get storage(): StorageDisk {
    return this.disk;
  }

  async getVerification(doctor: IUser): Promise<VerificationEntity> {
    const profile = await this.queryBus.execute(new GetDoctorProfileQuery(idOf(doctor)));
    if (!profile) throw new NotFoundException('Doctor profile not found');
    return toVerificationEntity(profile);
  }

  async submitLicense(doctor: IUser, { licenseNumber }: SubmitLicenseDto, files: StoredUpload[]): Promise<VerificationEntity> {
    const uploadedAt = new Date();
    const documents: ILicenseDocument[] = files.map((file) => ({
      key: file.key,
      originalName: file.originalname.slice(0, 200),
      mimeType: file.contentType,
      size: file.size,
      uploadedAt,
    }));

    const result = await this.commandBus.execute(new SubmitLicenseCommand(idOf(doctor), licenseNumber, documents)).catch(async (error: unknown) => {
      await this.removeFiles(documents.map((document) => document.key));
      throw error;
    });

    this.eventEmitter.emit(
      DOCTOR_LICENSE_SUBMITTED_EVENT,
      new DoctorLicenseSubmittedEvent(
        idOf(doctor).toString(),
        doctor.name,
        result.replaced.map((document) => document.key),
      ),
    );
    return toVerificationEntity(result.doctor);
  }

  async licenseDocumentKey(doctor: IUser, index: number): Promise<{ key: string; filename: string }> {
    const profile = await this.queryBus.execute(new GetDoctorProfileQuery(idOf(doctor)));
    const document = profile?.licenseDocuments?.[index];
    if (!document) throw new NotFoundException('Document not found');
    return { key: document.key, filename: document.originalName };
  }

  private async removeFiles(keys: string[]): Promise<void> {
    if (!keys.length) return;
    await this.disk.delete(keys).catch((error: Error) => this.logger.warn(`Could not delete license files: ${error.message}`));
  }

  async getClinic(doctor: IUser): Promise<DoctorClinicEntity> {
    const profile = await this.queryBus.execute(new GetDoctorProfileQuery(idOf(doctor)));
    if (!profile) throw new NotFoundException('Doctor profile not found');
    return toDoctorClinicEntity(profile);
  }

  async updateClinic(doctor: IUser, body: UpdateClinicDto): Promise<DoctorClinicEntity> {
    const data: ClinicData = Object.fromEntries(Object.entries(body).filter(([, value]) => value !== undefined));
    return toDoctorClinicEntity(await this.commandBus.execute(new UpsertClinicCommand(idOf(doctor), data)));
  }

  async createPatient(doctor: IUser, { name, email, city, phone, ...profile }: CreatePatientDto): Promise<PatientEntity> {
    const doctorId = idOf(doctor);
    const patientId = await this.commandBus.execute(new CreatePatientCommand({ name, email, city, phone }, profile, doctorId, doctorId));
    const patient = await this.queryBus.execute(new FindPatientByIdQuery(patientId));
    if (!patient) throw new NotFoundException('Patient not found');
    this.eventEmitter.emit(DOCTOR_PATIENT_ASSIGNED_EVENT, new DoctorPatientAssignedEvent(doctorId.toString(), doctor.name, patient.user._id.toString()));
    return toPatientEntity(patient);
  }

  async searchPatients(doctor: IUser, { search, page = 1, size = 10 }: SearchPatientsDto): Promise<PatientSearchPage> {
    const result = await this.queryBus.execute(new SearchPatientsForAssignmentQuery(idOf(doctor), search, page, size));
    return { ...result, docs: result.docs.map((patient) => toPatientSearchEntity(patient)) };
  }

  async assignPatient(doctor: IUser, patientId: Types.ObjectId): Promise<{ created: boolean; patient: PatientEntity }> {
    const patient = await this.queryBus.execute(new FindPatientByIdQuery(patientId));
    if (!patient?.user || patient.user.isActive === false) throw new NotFoundException('Patient not found');
    const { created } = await this.commandBus.execute(new AssignPatientCommand(idOf(doctor), patient.user._id));
    if (created)
      this.eventEmitter.emit(DOCTOR_PATIENT_ASSIGNED_EVENT, new DoctorPatientAssignedEvent(idOf(doctor).toString(), doctor.name, patient.user._id.toString()));
    return { created, patient: toPatientEntity(patient) };
  }

  async unassignPatient(doctor: IUser, patientId: Types.ObjectId): Promise<void> {
    const patient = await this.queryBus.execute(new FindPatientByIdQuery(patientId));
    if (!patient?.user) throw new NotFoundException('Patient not found');
    const ended = await this.commandBus.execute(new UnassignPatientCommand(idOf(doctor), patient.user._id));
    if (!ended) throw new NotFoundException('Assignment not found');
    this.eventEmitter.emit(
      DOCTOR_PATIENT_UNASSIGNED_EVENT,
      new DoctorPatientUnassignedEvent(idOf(doctor).toString(), doctor.name, patient.user._id.toString()),
    );
  }
}

const idOf = (user: IUser): Types.ObjectId => new Types.ObjectId(user._id);
