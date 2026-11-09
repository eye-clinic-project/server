import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import type { HUserDocument } from '../../database/model/user.model.js';
import { DoctorPatientRepository } from '../../database/repository/doctor-patient.repository.js';
import { UserRepository } from '../../database/repository/user.repository.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { AssignmentStatus, NotificationType } from '../../dependency/enum/database.enum.js';
import { NotifierService } from '../../dependency/service/notifier.service.js';
import { presentUser } from '../../dependency/presenter.js';
import { AssignmentQueryDto, CreateAssignmentDto, UpdateAssignmentDto } from './dto/doctor-patient.dto.js';

@Injectable()
export class DoctorPatientService {
  constructor(
    private readonly assignments: DoctorPatientRepository,
    private readonly users: UserRepository,
    private readonly notifier: NotifierService,
  ) {}

  private present(row: any) {
    return {
      id: row._id.toString(),
      _id: row._id.toString(),
      status: row.status,
      assignedAt: row.assignedAt,
      endedAt: row.endedAt ?? null,
      notes: row.notes,
      doctor: typeof row.doctor === 'object' && row.doctor && 'email' in row.doctor ? presentUser(row.doctor) : row.doctor?.toString(),
      patient: typeof row.patient === 'object' && row.patient && 'email' in row.patient ? presentUser(row.patient) : row.patient?.toString(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private async findUser(id: string | undefined, email: string | undefined, role: SystemRoleEnum) {
    const user = id
      ? await this.users.findById({ _id: id })
      : email
        ? await this.users.findByEmailWithoutPassword(email)
        : null;
    if (!user || user.role !== role) {
      throw new NotFoundException(role === SystemRoleEnum.PATIENT ? 'Patient not found' : 'Doctor not found');
    }
    return user;
  }

  /** FR2.3: assign a patient to a doctor. */
  async create(actor: HUserDocument, dto: CreateAssignmentDto) {
    let doctor: HUserDocument;
    let patient: HUserDocument;
    let status: AssignmentStatus;

    if (actor.role === SystemRoleEnum.DOCTOR) {
      doctor = actor;
      patient = await this.findUser(dto.patientId, dto.patientEmail, SystemRoleEnum.PATIENT);
      status = AssignmentStatus.ACTIVE;
    } else if (actor.role === SystemRoleEnum.PATIENT) {
      if (!dto.doctorId) throw new BadRequestException('doctorId is required');
      patient = actor;
      doctor = await this.findUser(dto.doctorId, undefined, SystemRoleEnum.DOCTOR);
      status = AssignmentStatus.PENDING;
    } else {
      if (!dto.doctorId) throw new BadRequestException('doctorId is required');
      doctor = await this.findUser(dto.doctorId, undefined, SystemRoleEnum.DOCTOR);
      patient = await this.findUser(dto.patientId, dto.patientEmail, SystemRoleEnum.PATIENT);
      status = AssignmentStatus.ACTIVE;
    }

    const existing = await this.assignments.findOne({ filter: { doctor: doctor._id, patient: patient._id } });
    if (existing?.status === AssignmentStatus.ACTIVE) {
      return this.findOne(actor, existing._id);
    }
    // A patient re-requesting a pending link changes nothing; a doctor accepting a pending request activates it.
    const nextStatus =
      existing?.status === AssignmentStatus.PENDING && actor.role === SystemRoleEnum.PATIENT
        ? AssignmentStatus.PENDING
        : status;

    const row = await this.assignments.findOneAndUpdate({
      filter: { doctor: doctor._id, patient: patient._id },
      update: {
        $set: {
          status: nextStatus,
          assignedAt: new Date(),
          assignedBy: actor._id,
          endedAt: null,
          ...(dto.notes ? { notes: dto.notes } : {}),
        },
      },
      options: { upsert: true, new: true },
    });

    if (nextStatus === AssignmentStatus.ACTIVE) {
      await this.notifier.notify({
        recipient: patient._id,
        type: NotificationType.SYSTEM,
        title: 'A doctor was assigned to you',
        body: `Dr. ${doctor.name} can now follow your eye screening results.`,
        link: '/patient/doctors',
        resourceId: row!._id,
      });
    } else {
      await this.notifier.notify({
        recipient: doctor._id,
        type: NotificationType.SYSTEM,
        title: 'New patient request',
        body: `${patient.name} asked to be followed by you.`,
        link: '/doctor/patients?tab=requests',
        resourceId: row!._id,
      });
    }
    return this.findOne(actor, row!._id);
  }

  async list(actor: HUserDocument, query: AssignmentQueryDto) {
    const filter: Record<string, unknown> = {};
    if (actor.role === SystemRoleEnum.DOCTOR) filter.doctor = actor._id;
    if (actor.role === SystemRoleEnum.PATIENT) filter.patient = actor._id;
    if (query.status) filter.status = query.status;
    const page = await this.assignments.paginate({
      filter,
      options: { sort: { assignedAt: -1 }, populate: [{ path: 'doctor' }, { path: 'patient' }], lean: true },
      page: query.page,
      size: query.size,
    });
    return {
      items: page.docs.map((row) => this.present(row)),
      total: page.count,
      page: page.currentPage,
      size: page.size,
      pages: page.pages,
    };
  }

  private async load(actor: HUserDocument, id: Types.ObjectId) {
    const row = await this.assignments.findById({ _id: id });
    if (!row) throw new NotFoundException('Assignment not found');
    const involved = row.doctor.equals(actor._id) || row.patient.equals(actor._id);
    if (!involved && actor.role !== SystemRoleEnum.ADMIN) {
      throw new ForbiddenException('You do not have access to this assignment');
    }
    return row;
  }

  async findOne(actor: HUserDocument, id: Types.ObjectId) {
    await this.load(actor, id);
    const row = await this.assignments.findById({
      _id: id,
      options: { populate: [{ path: 'doctor' }, { path: 'patient' }], lean: true },
    });
    return this.present(row);
  }

  async update(actor: HUserDocument, id: Types.ObjectId, dto: UpdateAssignmentDto) {
    const row = await this.load(actor, id);
    if (dto.status === AssignmentStatus.ACTIVE) {
      // Only the doctor (or an admin) can accept a patient.
      if (actor.role === SystemRoleEnum.PATIENT) {
        throw new ForbiddenException('Only the doctor can accept this request');
      }
    }
    await this.assignments.updateOne({
      filter: { _id: row._id },
      update: {
        $set: {
          ...(dto.status ? { status: dto.status, endedAt: dto.status === AssignmentStatus.ENDED ? new Date() : null } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        },
      },
    });
    if (dto.status === AssignmentStatus.ACTIVE && row.status !== AssignmentStatus.ACTIVE) {
      await this.notifier.notify({
        recipient: row.patient,
        type: NotificationType.SYSTEM,
        title: 'Your doctor request was accepted',
        body: `Dr. ${actor.name} accepted your request.`,
        link: '/patient/doctors',
        resourceId: row._id,
      });
    }
    return this.findOne(actor, id);
  }

  async remove(actor: HUserDocument, id: Types.ObjectId) {
    const row = await this.load(actor, id);
    await this.assignments.deleteOne({ filter: { _id: row._id } });
    return { deleted: true };
  }
}
