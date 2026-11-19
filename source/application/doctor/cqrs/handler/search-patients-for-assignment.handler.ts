import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { QueryFilter, Types } from 'mongoose';

import type { IPatient } from '../../../../dependencies/interface/index.js';
import type { PatientSearchView } from '../../entity/index.js';
import { SearchPatientsForAssignmentQuery } from '../query/index.js';
import { AssignmentStatus, SystemRoleEnum } from '../../../../dependencies/enum/index.js';
import { DoctorPatientRepository, PatientRepository, UserRepository } from '../../../../database/repository/index.js';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@QueryHandler(SearchPatientsForAssignmentQuery)
export class SearchPatientsForAssignmentHandler implements IQueryHandler<SearchPatientsForAssignmentQuery> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly userRepository: UserRepository,
    private readonly doctorPatientRepository: DoctorPatientRepository,
  ) {}

  async execute({ doctorId, search, page, size }: SearchPatientsForAssignmentQuery) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    const users: { _id: Types.ObjectId }[] = await this.userRepository.find({
      filter: { role: SystemRoleEnum.PATIENT, isActive: { $ne: false }, $or: [{ name: pattern }, { email: pattern }] },
      projection: { _id: 1 },
      options: { lean: true, limit: 1000 },
    });
    const filter: QueryFilter<IPatient> = { $or: [{ user: { $in: users.map((user) => user._id) } }, { medicalRecordNumber: pattern }] };

    const result = await this.patientRepository.paginate({
      filter,
      projection: { medicalRecordNumber: 1, user: 1 },
      options: { lean: true, sort: { createdAt: -1 }, populate: [{ path: 'user', select: 'name email city avatarUrl' }] },
      page,
      size,
    });
    const docs = (result.docs as Omit<PatientSearchView, 'assigned'>[]).filter((patient) => patient.user);

    const assignments: { patient: Types.ObjectId }[] = await this.doctorPatientRepository.find({
      filter: { doctor: doctorId, status: AssignmentStatus.ACTIVE, patient: { $in: docs.map((patient) => patient.user._id) } },
      projection: { patient: 1 },
      options: { lean: true },
    });
    const assigned = new Set(assignments.map((assignment) => assignment.patient.toString()));

    return { ...result, docs: docs.map((patient) => ({ ...patient, assigned: assigned.has(patient.user._id.toString()) })) };
  }
}
