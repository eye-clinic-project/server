import { Module } from '@nestjs/common';
import { DoctorReviewService } from './doctor-review.service.js';
import { DoctorReviewController } from './doctor-review.controller.js';

@Module({
  controllers: [DoctorReviewController],
  providers: [DoctorReviewService],
})
export class DoctorReviewModule {}
