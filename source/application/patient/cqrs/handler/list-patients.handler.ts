import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { QueryFilter, Types } from 'mongoose';

import type { IPatient } from '../../../../dependencies/interface/database.interface.js';
import { AssignmentStatus } from '../../../../dependencies/enum/database.enum.js';
import { SystemRoleEnum } from '../../../../dependencies/enum/security.enum.js';
import { DoctorPatientRepository } from '../../../../database/repository/doctor-patient.repository.js';
import { PatientRepository } from '../../../../database/repository/patient.repository.js';
import { UserRepository } from '../../../../database/repository/user.repository.js';
import { ListPatientsQuery, type PatientPage } from '../query/list-patients.query.js';
import { PATIENT_USER_FIELDS } from '../../entity/patient.type.js';

const populateUser = [{ path: 'user', select: PATIENT_USER_FIELDS }];

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@QueryHandler(ListPatientsQuery)
export class ListPatientsHandler implements IQueryHandler<ListPatientsQuery> {
  constructor(
    private readonly patientRepository: PatientRepository,
    private readonly userRepository: UserRepository,
    private readonly doctorPatientRepository: DoctorPatientRepository,
  ) {}

  async execute({ page, size, search, doctorId }: ListPatientsQuery): Promise<PatientPage> {
    const conditions: QueryFilter<IPatient>[] = [];

    if (doctorId) {
      const assignments = await this.doctorPatientRepository.find({
        filter: { doctor: doctorId, status: AssignmentStatus.ACTIVE },
        projection: { patient: 1 },
        options: { lean: true },
      });
      conditions.push({ user: { $in: assignments.map((assignment: { patient: Types.ObjectId }) => assignment.patient) } });
    }

    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      const users = await this.userRepository.find({
        filter: { role: SystemRoleEnum.PATIENT, $or: [{ name: pattern }, { email: pattern }] },
        projection: { _id: 1 },
        options: { lean: true, limit: 1000 },
      });
      conditions.push({ $or: [{ user: { $in: users.map((user: { _id: Types.ObjectId }) => user._id) } }, { medicalRecordNumber: pattern }] });
    }

    return this.patientRepository.paginate({
      filter: conditions.length ? { $and: conditions } : {},
      options: { lean: true, populate: populateUser, sort: { createdAt: -1 } },
      page,
      size,
    });
  }
}
