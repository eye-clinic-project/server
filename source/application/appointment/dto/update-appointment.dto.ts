import { PartialType } from '@nestjs/swagger';
import { CreateAppointmentDto } from './create-appointment.dto.js';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}
