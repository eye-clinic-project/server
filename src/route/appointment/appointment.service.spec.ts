import { BadRequestException, ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { AppointmentStatus } from '../../common/enum/schema.enum.js';
import { UserRoleEnum } from '../../common/enum/security.enum.js';
import { AppointmentRepository } from '../../core/database/repository/appointment.repository.js';
import { DoctorService } from '../doctor/doctor.service.js';
import { PatientService } from '../patient/patient.service.js';
import { AppointmentService } from './appointment.service.js';

describe('AppointmentService', () => {
  let service: AppointmentService;
  const appointments = {
    create: vi.fn(),
    findForParticipant: vi.fn(),
    findByIdForParticipant: vi.fn(),
    findParticipantAppointment: vi.fn(),
    findConflict: vi.fn(),
    updateScheduleIfActive: vi.fn(),
    transitionStatus: vi.fn(),
    findUpcomingByDoctor: vi.fn(),
    findUpcomingByPatient: vi.fn(),
  };
  const doctors = {
    findProfile: vi.fn(),
    assertAssignedPatient: vi.fn(),
  };
  const patients = { findProfile: vi.fn() };
  const doctorId = new Types.ObjectId();
  const patientId = new Types.ObjectId();

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        { provide: AppointmentRepository, useValue: appointments },
        { provide: DoctorService, useValue: doctors },
        { provide: PatientService, useValue: patients },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
  });

  it('creates a patient request after checking both profiles and assignment', async () => {
    const scheduledAt = new Date(Date.now() + 60_000);
    appointments.findConflict.mockResolvedValue(null);
    appointments.create.mockResolvedValue({ _id: new Types.ObjectId() });

    await service.create(patientId.toString(), {
      doctorId: doctorId.toString(),
      scheduledAt,
      notes: '  Follow-up  ',
    });

    expect(doctors.findProfile).toHaveBeenCalledWith(doctorId.toString());
    expect(patients.findProfile).toHaveBeenCalledWith(patientId);
    expect(doctors.assertAssignedPatient).toHaveBeenCalledWith(
      doctorId,
      patientId,
    );
    expect(appointments.create).toHaveBeenCalledWith({
      data: {
        doctor: doctorId,
        patient: patientId,
        scheduledAt,
        status: AppointmentStatus.PENDING,
        notes: 'Follow-up',
      },
    });
  });

  it('rejects appointment times in the past', async () => {
    await expect(
      service.create(patientId.toString(), {
        doctorId: doctorId.toString(),
        scheduledAt: new Date(Date.now() - 1_000),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(doctors.findProfile).not.toHaveBeenCalled();
    expect(appointments.create).not.toHaveBeenCalled();
  });

  it('rejects a conflicting appointment', async () => {
    const scheduledAt = new Date(Date.now() + 60_000);
    appointments.findConflict.mockResolvedValue({ _id: new Types.ObjectId() });

    await expect(
      service.create(patientId.toString(), {
        doctorId: doctorId.toString(),
        scheduledAt,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(appointments.create).not.toHaveBeenCalled();
  });

  it("confirms only the authenticated doctor's pending appointment", async () => {
    appointments.findParticipantAppointment.mockResolvedValue({
      doctor: doctorId,
      patient: patientId,
    });
    appointments.transitionStatus.mockResolvedValue({
      status: AppointmentStatus.CONFIRMED,
    });
    const appointmentId = new Types.ObjectId().toString();

    await service.confirm(doctorId.toString(), appointmentId);

    expect(doctors.assertAssignedPatient).toHaveBeenCalledWith(
      doctorId,
      patientId,
    );
    expect(appointments.transitionStatus).toHaveBeenCalledWith({
      appointmentId: new Types.ObjectId(appointmentId),
      userId: doctorId,
      role: 'doctor',
      from: [AppointmentStatus.PENDING],
      to: AppointmentStatus.CONFIRMED,
    });
  });

  it('reschedules only an assigned appointment and requires reconfirmation', async () => {
    const appointmentId = new Types.ObjectId().toString();
    const scheduledAt = new Date(Date.now() + 120_000);
    appointments.findParticipantAppointment.mockResolvedValue({
      doctor: doctorId,
      patient: patientId,
    });
    appointments.findConflict.mockResolvedValue(null);
    appointments.updateScheduleIfActive.mockResolvedValue({
      scheduledAt,
      status: AppointmentStatus.PENDING,
    });

    await service.reschedule(patientId.toString(), appointmentId, {
      scheduledAt,
    });

    expect(doctors.assertAssignedPatient).toHaveBeenCalledWith(
      doctorId,
      patientId,
    );
    expect(appointments.updateScheduleIfActive).toHaveBeenCalledWith({
      appointmentId: new Types.ObjectId(appointmentId),
      scheduledAt,
      notes: undefined,
    });
  });

  it('lists only appointments belonging to the authenticated participant', async () => {
    appointments.findForParticipant.mockResolvedValue([]);

    await service.findAll(patientId.toString());

    expect(appointments.findForParticipant).toHaveBeenCalledWith(patientId);
  });

  it('uses the patient-specific upcoming appointment query', async () => {
    appointments.findUpcomingByPatient.mockResolvedValue([]);

    await service.findUpcoming(patientId.toString(), UserRoleEnum.PATIENT);

    expect(appointments.findUpcomingByPatient).toHaveBeenCalledWith(patientId);
  });
});
