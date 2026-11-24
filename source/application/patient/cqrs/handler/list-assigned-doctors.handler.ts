import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { Types } from 'mongoose';

import type { IDoctor } from '../../../../dependencies/interface/database.interface.js';
import { ASSIGNED_DOCTOR_USER_FIELDS, type AssignedDoctorView } from '../../entity/patient.type.js';
import { ListAssignedDoctorsQuery } from '../query/list-assigned-doctors.query.js';
import { AssignmentStatus } from '../../../../dependencies/enum/database.enum.js';
import { DoctorPatientRepository } from '../../../../database/repository/doctor-patient.repository.js';
import { DoctorRepository } from '../../../../database/repository/doctor.repository.js';

@QueryHandler(ListAssignedDoctorsQuery)
export class ListAssignedDoctorsHandler implements IQueryHandler<ListAssignedDoctorsQuery> {
  constructor(
    private readonly doctorPatientRepository: DoctorPatientRepository,
    private readonly doctorRepository: DoctorRepository,
  ) {}

  async execute({ patientUserId }: ListAssignedDoctorsQuery): Promise<AssignedDoctorView[]> {
    const assignments: Omit<AssignedDoctorView, 'profile'>[] = await this.doctorPatientRepository.find({
      filter: { patient: patientUserId, status: AssignmentStatus.ACTIVE },
      projection: { doctor: 1, assignedAt: 1 },
      options: { lean: true, sort: { assignedAt: -1 }, populate: [{ path: 'doctor', select: ASSIGNED_DOCTOR_USER_FIELDS }] },
    });
    const active = assignments.filter((assignment) => assignment.doctor && assignment.doctor.isActive !== false);
    if (!active.length) return [];

    const profiles: (IDoctor & { user: Types.ObjectId })[] = await this.doctorRepository.find({
      filter: { user: { $in: active.map((assignment) => assignment.doctor._id) } },
      projection: { user: 1, clinicName: 1, clinicAddress: 1, specialty: 1, bio: 1, yearsOfExperience: 1, verificationStatus: 1 },
      options: { lean: true },
    });
    const byUser = new Map(profiles.map((profile) => [profile.user.toString(), profile]));

    return active.map((assignment) => ({ ...assignment, profile: byUser.get(assignment.doctor._id.toString()) ?? null }));
  }
}
