import { PartialType } from '@nestjs/swagger';
import { CreateDoctorDto } from './create-doctor.dto.js';

export class UpdateDoctorDto extends PartialType(CreateDoctorDto) {}
