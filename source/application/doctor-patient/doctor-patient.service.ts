import { Injectable } from '@nestjs/common';
import { CreateDoctorPatientDto } from './dto/create-doctor-patient.dto.js';
import { UpdateDoctorPatientDto } from './dto/update-doctor-patient.dto.js';

@Injectable()
export class DoctorPatientService {
  create(createDoctorPatientDto: CreateDoctorPatientDto) {
    return 'This action adds a new doctorPatient';
  }

  findAll() {
    return `This action returns all doctorPatient`;
  }

  findOne(id: number) {
    return `This action returns a #${id} doctorPatient`;
  }

  update(id: number, updateDoctorPatientDto: UpdateDoctorPatientDto) {
    return `This action updates a #${id} doctorPatient`;
  }

  remove(id: number) {
    return `This action removes a #${id} doctorPatient`;
  }
}
