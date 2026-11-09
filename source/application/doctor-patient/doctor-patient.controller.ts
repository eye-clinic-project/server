import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DoctorPatientService } from './doctor-patient.service.js';
import { CreateDoctorPatientDto } from './dto/create-doctor-patient.dto.js';
import { UpdateDoctorPatientDto } from './dto/update-doctor-patient.dto.js';

@Controller('doctor-patient')
export class DoctorPatientController {
  constructor(private readonly doctorPatientService: DoctorPatientService) {}

  @Post()
  create(@Body() createDoctorPatientDto: CreateDoctorPatientDto) {
    return this.doctorPatientService.create(createDoctorPatientDto);
  }

  @Get()
  findAll() {
    return this.doctorPatientService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.doctorPatientService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDoctorPatientDto: UpdateDoctorPatientDto) {
    return this.doctorPatientService.update(+id, updateDoctorPatientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.doctorPatientService.remove(+id);
  }
}
