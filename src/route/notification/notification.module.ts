import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service.js';
import { NotificationController } from './notification.controller.js';
import { AuthGuard } from '../../common/guard/auth.guard.js';
import { RolesGuard } from '../../common/guard/role.guard.js';
import { NotificationRepository } from '../../core/database/repository/notification.repository.js';
import { UserRepository } from '../../core/database/repository/user.repository.js';
import { DoctorPatientRepository } from '../../core/database/repository/doctor-patient.repository.js';


@Module({
  providers: [
    NotificationService,
    // NotificationResolver,
    NotificationRepository,
    UserRepository,
    DoctorPatientRepository,
    AuthGuard,
    RolesGuard,
  ],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
