import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import { AnalysisRepository } from '../../core/database/repository/analysis.repository.js';

function objectId(id: string): Types.ObjectId {
  if (!Types.ObjectId.isValid(id)) {
    throw new NotFoundException('Analysis not found');
  }
  return new Types.ObjectId(id);
}

@Injectable()
export class AnalysisService {
  constructor(private readonly analyses: AnalysisRepository) {}

  findForUser(userId: string, role: UserRoleEnum) {
    const id = objectId(userId);
    if (role === UserRoleEnum.DOCTOR) {
      return this.analyses.findByDoctor(id);
    }
    if (role === UserRoleEnum.PATIENT) {
      return this.analyses.findByPatient(id);
    }
    throw new ForbiddenException('A doctor or patient account is required');
  }

  async findOneForUser(userId: string, role: UserRoleEnum, analysisId: string) {
    if (role !== UserRoleEnum.DOCTOR && role !== UserRoleEnum.PATIENT) {
      throw new ForbiddenException('A doctor or patient account is required');
    }

    const id = objectId(userId);
    const analysis = await this.analyses.findOne({
      filter: {
        _id: objectId(analysisId),
        [role === UserRoleEnum.DOCTOR ? 'doctor' : 'patient']: id,
      },
      options: {
        populate: [{ path: 'doctor' }, { path: 'patient' }, { path: 'image' }],
      },
    });
    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }
    return analysis;
  }
}
