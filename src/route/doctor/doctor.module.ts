import { Module } from '@nestjs/common';
import { DoctorService } from './doctor.service.js';
import { DoctorController } from './doctor.controller.js';

@Module({
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}
