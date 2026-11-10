import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import type { HUserDocument } from '../../database/model/user.model.js';
import { DoctorAvailabilityRepository } from '../../database/repository/doctor-availability.repository.js';
import { SystemRoleEnum } from '../../dependency/enum/security.enum.js';
import { AvailabilityQueryDto, CreateAvailabilityDto, UpdateAvailabilityDto } from './dto/availability.dto.js';

const MAX_SLOTS_PER_REQUEST = 200;

export const presentSlot = (s: any) => ({
  id: s._id.toString(),
  _id: s._id.toString(),
  doctor: s.doctor?._id?.toString?.() ?? s.doctor?.toString(),
  startAt: s.startAt,
  endAt: s.endAt,
  isBooked: s.isBooked,
  appointment: s.appointment?.toString() ?? null,
});

/** Splits [start, end) into slots; exported for unit tests. */
export const buildSlots = (start: Date, end: Date, minutes?: number) => {
  if (end <= start) throw new BadRequestException('endAt must be after startAt');
  if (!minutes) return [{ startAt: start, endAt: end }];
  const step = minutes * 60_000;
  const slots: { startAt: Date; endAt: Date }[] = [];
  for (let t = start.getTime(); t + step <= end.getTime(); t += step) {
    slots.push({ startAt: new Date(t), endAt: new Date(t + step) });
  }
  if (!slots.length) throw new BadRequestException('The range is shorter than one slot');
  if (slots.length > MAX_SLOTS_PER_REQUEST) {
    throw new BadRequestException(`At most ${MAX_SLOTS_PER_REQUEST} slots can be created at once`);
  }
  return slots;
};

@Injectable()
export class DoctorAvailabilityService {
  constructor(private readonly slots: DoctorAvailabilityRepository) {}

  private async assertNoOverlap(doctor: Types.ObjectId, ranges: { startAt: Date; endAt: Date }[], exceptId?: Types.ObjectId) {
    const first = ranges[0].startAt;
    const last = ranges[ranges.length - 1].endAt;
    const overlapping = await this.slots.typedModel.exists({
      doctor,
      ...(exceptId ? { _id: { $ne: exceptId } } : {}),
      startAt: { $lt: last },
      endAt: { $gt: first },
    });
    if (overlapping) throw new ConflictException('This time overlaps with an existing availability slot');
  }

  async create(doctor: HUserDocument, dto: CreateAvailabilityDto) {
    const ranges = buildSlots(dto.startAt, dto.endAt, dto.slotMinutes);
    await this.assertNoOverlap(doctor._id, ranges);
    const created = await this.slots.createMany({
      data: ranges.map((r) => ({ ...r, doctor: doctor._id, isBooked: false, appointment: null })),
    });
    return created.map((s: any) => presentSlot(s));
  }

  async list(viewer: HUserDocument, query: AvailabilityQueryDto) {
    const doctorId = query.doctorId ? new Types.ObjectId(query.doctorId) : viewer.role === SystemRoleEnum.DOCTOR ? viewer._id : undefined;
    if (!doctorId) throw new BadRequestException('doctorId is required');
    const isOwner = viewer._id.equals(doctorId) || viewer.role === SystemRoleEnum.ADMIN;
    const onlyAvailable = query.onlyAvailable ?? !isOwner;
    const from = query.from ?? new Date();
    const filter: Record<string, any> = { doctor: doctorId, startAt: { $gte: from } };
    if (query.to) filter.startAt.$lte = query.to;
    if (onlyAvailable) filter.isBooked = false;
    const rows = await this.slots.find({ filter, options: { sort: { startAt: 1 }, limit: 500, lean: true } });
    return rows.map((s) => presentSlot(s));
  }

  async findOne(id: Types.ObjectId) {
    const slot = await this.slots.findById({ _id: id, options: { lean: true } });
    if (!slot) throw new NotFoundException('Slot not found');
    return presentSlot(slot);
  }

  private async loadOwn(doctor: HUserDocument, id: Types.ObjectId) {
    const slot = await this.slots.findById({ _id: id });
    if (!slot) throw new NotFoundException('Slot not found');
    if (!slot.doctor.equals(doctor._id) && doctor.role !== SystemRoleEnum.ADMIN) {
      throw new ForbiddenException('You can only change your own availability');
    }
    if (slot.isBooked) throw new ConflictException('This slot is booked. Reschedule or cancel the appointment first.');
    return slot;
  }

  async update(doctor: HUserDocument, id: Types.ObjectId, dto: UpdateAvailabilityDto) {
    const slot = await this.loadOwn(doctor, id);
    const startAt = dto.startAt ?? slot.startAt;
    const endAt = dto.endAt ?? slot.endAt;
    buildSlots(startAt, endAt);
    await this.assertNoOverlap(slot.doctor, [{ startAt, endAt }], slot._id);
    const updated = await this.slots.findOneAndUpdate({
      filter: { _id: id, isBooked: false },
      update: { $set: { startAt, endAt } },
    });
    if (!updated) throw new ConflictException('This slot was just booked');
    return presentSlot(updated);
  }

  async remove(doctor: HUserDocument, id: Types.ObjectId) {
    await this.loadOwn(doctor, id);
    const result = await this.slots.deleteOne({ filter: { _id: id, isBooked: false } });
    if (!result.deletedCount) throw new ConflictException('This slot was just booked');
    return { deleted: true };
  }
}
