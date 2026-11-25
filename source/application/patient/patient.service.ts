import { ForbiddenException, Injectable, NotFoundException, type OnApplicationBootstrap } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Types } from 'mongoose';

import { EventEmitter2 } from '@nestjs/event-emitter';

import { SystemRoleEnum } from '../../dependencies/enum/security.enum.js';
import { LoggerService } from '../../dependencies/service/logger.service.js';
import type { IUser } from '../../dependencies/interface/database.interface.js';
import { PATIENT_CREATED_EVENT, PatientCreatedEvent } from './event/patient-created.event.js';
import { BackfillPatientRecordsCommand } from './custom/command/backfill-patient-records.command.js';
import { CreatePatientCommand } from './custom/command/create-patient.command.js';
import { DeletePatientCommand } from './custom/command/delete-patient.command.js';
import { EnsurePatientRecordCommand } from './custom/command/ensure-patient-record.command.js';
import { type PatientAccountUpdate, UpdatePatientCommand } from './custom/command/update-patient.command.js';
import type { PatientProfileData } from './type/patient.type.js';
import { FindPatientByIdQuery } from './custom/query/find-patient-by-id.query.js';
import { FindPatientByUserQuery } from './custom/query/find-patient-by-user.query.js';
import { IsPatientAssignedQuery } from './custom/query/is-patient-assigned.query.js';
import { ListAssignedDoctorsQuery } from './custom/query/list-assigned-doctors.query.js';
import { ListPatientsQuery } from './custom/query/list-patients.query.js';
import { CreatePatientDto } from './dto/create-patient.dto.js';
import { ListPatientsDto } from './dto/list-patients.dto.js';
import { UpdatePatientDto } from './dto/update-patient.dto.js';
import { AssignedDoctorEntity, toAssignedDoctorEntity } from './entity/assigned-doctor.entity.js';
import { PatientEntity, PatientView, toPatientEntity } from './entity/patient.entity.js';
import type { PatientListEntity } from './type/patient.type.js';

@Injectable()
export class PatientService implements OnApplicationBootstrap {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
    private readonly eventEmitter: EventEmitter2,
    private readonly loggerService: LoggerService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const created = await this.commandBus.execute(new BackfillPatientRecordsCommand()).catch((error: unknown) => {
      this.loggerService.warn(error);
      return 0;
    });
    if (created) this.loggerService.log(`Created ${created} missing patient record(s)`);
  }

  async create(actor: IUser, { name, email, city, phone, ...profile }: CreatePatientDto): Promise<PatientEntity> {
    const actorId = idOf(actor);
    const patientId = await this.commandBus.execute(
      new CreatePatientCommand({ name, email, city, phone }, pickProfile(profile), actorId, isDoctor(actor) ? actorId : undefined),
    );
    const patient = await this.load(patientId);
    this.eventEmitter.emit(
      PATIENT_CREATED_EVENT,
      new PatientCreatedEvent(
        patient._id.toString(),
        patient.user._id.toString(),
        actorId.toString(),
        isDoctor(actor) ? { id: actorId.toString(), name: actor.name } : null,
      ),
    );
    return toPatientEntity(patient);
  }

  async findAll(actor: IUser, { page = 1, size = 20, search }: ListPatientsDto): Promise<PatientListEntity> {
    const result = await this.queryBus.execute(new ListPatientsQuery(page, size, search || undefined, isDoctor(actor) ? idOf(actor) : undefined));
    return { ...result, docs: result.docs.map((patient) => toPatientEntity(patient)) };
  }

  async findMine(actor: IUser): Promise<PatientEntity> {
    await this.commandBus.execute(new EnsurePatientRecordCommand(idOf(actor)));
    const patient = await this.queryBus.execute(new FindPatientByUserQuery(idOf(actor)));
    if (!patient) throw new NotFoundException('Patient profile not found');
    return toPatientEntity(patient);
  }

  async findOne(actor: IUser, patientId: Types.ObjectId): Promise<PatientEntity> {
    const patient = await this.load(patientId);
    await this.assertAccess(actor, patient);
    return toPatientEntity(patient);
  }

  async findMyDoctors(actor: IUser): Promise<AssignedDoctorEntity[]> {
    const doctors = await this.queryBus.execute(new ListAssignedDoctorsQuery(idOf(actor)));
    return doctors.map((doctor) => toAssignedDoctorEntity(doctor));
  }

  async update(actor: IUser, patientId: Types.ObjectId, { name, city, phone, ...profile }: UpdatePatientDto): Promise<PatientEntity> {
    const patient = await this.load(patientId);
    await this.assertAccess(actor, patient);

    const account: PatientAccountUpdate = { ...(name !== undefined && { name }), ...(city !== undefined && { city }), ...(phone !== undefined && { phone }) };
    await this.commandBus.execute(new UpdatePatientCommand(patient._id, patient.user._id, account, pickProfile(profile)));
    return toPatientEntity(await this.load(patientId));
  }

  async remove(actor: IUser, patientId: Types.ObjectId): Promise<void> {
    const patient = await this.load(patientId);
    await this.assertAccess(actor, patient);
    if (isDoctor(actor) && !patient.createdBy?.equals(idOf(actor))) throw new ForbiddenException('You do not have access to this patient');
    await this.commandBus.execute(new DeletePatientCommand(patient._id, patient.user._id));
  }

  private async load(patientId: Types.ObjectId): Promise<PatientView> {
    const patient = await this.queryBus.execute(new FindPatientByIdQuery(patientId));
    if (!patient?.user) throw new NotFoundException('Patient not found');
    return patient;
  }

  private async assertAccess(actor: IUser, patient: PatientView): Promise<void> {
    if (actor.role === SystemRoleEnum.ADMIN) return;
    if (isDoctor(actor) && (await this.queryBus.execute(new IsPatientAssignedQuery(idOf(actor), patient.user._id)))) return;
    throw new ForbiddenException('You do not have access to this patient');
  }
}

const idOf = (user: IUser): Types.ObjectId => new Types.ObjectId(user._id);

const isDoctor = (user: IUser): boolean => user.role === SystemRoleEnum.DOCTOR;

const pickProfile = ({ dateOfBirth, gender, emergencyContact, diabetesSince, medicalNotes }: PatientProfileData): PatientProfileData => ({
  ...(dateOfBirth !== undefined && { dateOfBirth }),
  ...(gender !== undefined && { gender }),
  ...(emergencyContact !== undefined && { emergencyContact }),
  ...(diabetesSince !== undefined && { diabetesSince }),
  ...(medicalNotes !== undefined && { medicalNotes }),
});
