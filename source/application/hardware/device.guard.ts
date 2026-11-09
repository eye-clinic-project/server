import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { DeviceRepository } from '../../database/repository/device.repository.js';
import { DeviceStatus } from '../../dependency/enum/database.enum.js';
import type { HDeviceDocument } from '../../database/model/device.model.js';

export interface IDeviceReq extends Request {
  device: HDeviceDocument;
}

export const DEVICE_KEY_HEADER = 'x-device-key';
export const hashDeviceKey = (key: string) => createHash('sha256').update(key).digest('hex');

/** Authenticates a fundus camera by its API key (header "x-device-key: dev_<prefix>_<secret>"). */
@Injectable()
export class DeviceGuard implements CanActivate {
  constructor(private readonly devices: DeviceRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<IDeviceReq>();
    const key = req.headers[DEVICE_KEY_HEADER];
    const match = typeof key === 'string' ? /^dev_([A-Za-z0-9]{12})_[A-Za-z0-9_-]{32,}$/.exec(key) : null;
    if (!match) throw new UnauthorizedException('Missing or invalid device key');

    const device = await this.devices.findOne({ filter: { apiKeyPrefix: match[1] }, projection: '+apiKeyHash' });
    const expected = device ? Buffer.from(device.apiKeyHash, 'hex') : Buffer.alloc(32);
    const given = Buffer.from(hashDeviceKey(key as string), 'hex');
    if (!device || !timingSafeEqual(expected, given)) throw new UnauthorizedException('Invalid device key');
    if (device.status !== DeviceStatus.ACTIVE) throw new UnauthorizedException('Device is not active');

    req.device = device;
    void this.devices.updateOne({ filter: { _id: device._id }, update: { $set: { lastSeenAt: new Date() } } }).catch(() => undefined);
    return true;
  }
}
