import { SetMetadata } from '@nestjs/common';

export const allowPendingDoctorName = 'ALLOW_PENDING_DOCTOR';

/**
 * Lets doctors whose license is not approved yet reach this route (or every route of a controller).
 * Used for their own account, profile and notifications, so they can see their status and fix their license.
 */
export const AllowPendingDoctor = () => SetMetadata(allowPendingDoctorName, true);
