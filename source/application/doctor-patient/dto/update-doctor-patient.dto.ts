import { PartialType } from '@nestjs/swagger';
import { CreateDoctorPatientDto } from './create-doctor-patient.dto.js';

export class UpdateDoctorPatientDto extends PartialType(CreateDoctorPatientDto) {}
