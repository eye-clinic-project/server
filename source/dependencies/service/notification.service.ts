import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, type Cache } from '@nestjs/cache-manager';
import { I18nService } from '@nestjs/i18n';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, getApp, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { Types } from 'mongoose';

import { NotificationRepository } from '../../database/repository/notification.repository.js';
import { UserRepository } from '../../database/repository/user.repository.js';
import type { NotificationType } from '../enum/database.enum.js';

const deviceTokensKey = (userId: string): string => `notification:devices:${userId}`;

export interface PushNotification {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

export interface PushResult {
  successCount: number;
  failureCount: number;
}

export interface NotificationText {
  key: string;
  args?: Record<string, string>;
}

export type NotificationArg = string | number | Date | NotificationText;

export interface NotifyInput {
  recipient: Types.ObjectId | string;
  type: NotificationType;
  template: string;
  args?: Record<string, NotificationArg>;
  link?: string;
  resourceId?: Types.ObjectId | string | null;
  persist?: boolean;
  data?: Record<string, string>;
}

const FIREBASE_APP_NAME = 'retinacare';
const DEVICE_TOKENS_TTL_MS = 60 * 24 * 60 * 60_000;
const STALE_TOKEN_ERRORS = new Set(['messaging/registration-token-not-registered', 'messaging/invalid-registration-token', 'messaging/invalid-argument']);
const FALLBACK_LOCALE = 'en';
const DATE_LOCALES: Record<string, string> = { en: 'en-GB', ar: 'ar-EG' };

const isText = (value: NotificationArg): value is NotificationText => typeof value === 'object' && !(value instanceof Date) && 'key' in value;

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private readonly maxDevicesPerUser: number;
  private readonly timeZone: string;
  private firebase: Messaging | null | undefined;

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly i18n: I18nService,
    private readonly userRepository: UserRepository,
    private readonly notificationRepository: NotificationRepository,
  ) {
    this.maxDevicesPerUser = configService.get<number>('app.notifications.maxDevicesPerUser') ?? 10;
    this.timeZone = configService.get<string>('app.notifications.timezone') ?? 'Africa/Cairo';
  }

  dispatch(input: NotifyInput): void {
    void this.notify(input);
  }

  async notify({ recipient, type, template, args = {}, link, resourceId, persist = true, data = {} }: NotifyInput): Promise<void> {
    try {
      const recipientId = new Types.ObjectId(recipient);
      const user: { language?: string | null; isActive?: boolean } | null = await this.userRepository.findById({
        _id: recipientId,
        projection: { language: 1, isActive: 1 },
        options: { lean: true },
      });
      if (!user || user.isActive === false) return;

      const locale = user.language && user.language in DATE_LOCALES ? user.language : FALLBACK_LOCALE;
      const resolvedArgs = Object.fromEntries(Object.entries(args).map(([name, value]) => [name, this.resolveArg(value, locale)]));
      const title = this.i18n.translate(`notifications.${template}.title`, { locale, args: resolvedArgs });
      const body = this.i18n.translate(`notifications.${template}.body`, { locale, args: resolvedArgs });

      const saved = persist
        ? await this.notificationRepository.create({
            data: { recipient: recipientId, type, title, body, link, resourceId: resourceId ? new Types.ObjectId(resourceId) : null, read: false },
          })
        : null;

      const payload: Record<string, string> = {
        ...data,
        type,
        ...(link && { link }),
        ...(resourceId && { resourceId: resourceId.toString() }),
        ...(saved && { notificationId: saved._id.toString() }),
      };
      const { successCount } = await this.sendToUser(recipientId.toString(), { title, body, data: payload });
      if (saved && successCount) await this.notificationRepository.updateOne({ filter: { _id: saved._id }, update: { $set: { pushedAt: new Date() } } });
    } catch (error) {
      this.logger.warn(`Notification "${template}" to ${recipient.toString()} failed: ${(error as Error).message}`);
    }
  }

  formatDate(date: Date, locale: string = FALLBACK_LOCALE): string {
    return new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? DATE_LOCALES[FALLBACK_LOCALE], {
      timeZone: this.timeZone,
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  async registerDevice(userId: string, token: string): Promise<void> {
    const tokens = (await this.getDeviceTokens(userId)).filter((existing) => existing !== token);
    tokens.push(token);
    await this.saveDeviceTokens(userId, tokens.slice(-this.maxDevicesPerUser));
  }

  async unregisterDevice(userId: string, token: string): Promise<boolean> {
    const tokens = await this.getDeviceTokens(userId);
    const remaining = tokens.filter((existing) => existing !== token);
    await this.saveDeviceTokens(userId, remaining);
    return remaining.length !== tokens.length;
  }

  async unregisterAllDevices(userId: string): Promise<void> {
    await this.cacheManager.del(deviceTokensKey(userId));
  }

  async getDeviceTokens(userId: string): Promise<string[]> {
    return (await this.cacheManager.get<string[]>(deviceTokensKey(userId))) ?? [];
  }

  async sendToUser(userId: string, notification: PushNotification): Promise<PushResult> {
    const messaging = this.messaging();
    const tokens = await this.getDeviceTokens(userId);
    if (!messaging || !tokens.length) return { successCount: 0, failureCount: 0 };

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title: notification.title, body: notification.body, imageUrl: notification.imageUrl },
      data: notification.data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });

    const stale = response.responses.flatMap((result, index) =>
      !result.success && result.error && STALE_TOKEN_ERRORS.has(result.error.code) ? [tokens[index]] : [],
    );
    if (stale.length) {
      await this.saveDeviceTokens(
        userId,
        tokens.filter((token) => !stale.includes(token)),
      );
    }

    response.responses
      .filter((result) => !result.success && result.error && !STALE_TOKEN_ERRORS.has(result.error.code))
      .forEach((result) => this.logger.warn(`Push to user ${userId} failed: ${result.error?.code} ${result.error?.message}`));

    return { successCount: response.successCount, failureCount: response.failureCount };
  }

  async sendToUsers(userIds: string[], notification: PushNotification): Promise<PushResult> {
    const results = await Promise.all([...new Set(userIds)].map((userId) => this.sendToUser(userId, notification)));
    return results.reduce(
      (total, result) => ({ successCount: total.successCount + result.successCount, failureCount: total.failureCount + result.failureCount }),
      {
        successCount: 0,
        failureCount: 0,
      },
    );
  }

  async sendToTopic(topic: string, notification: PushNotification): Promise<string | null> {
    const messaging = this.messaging();
    if (!messaging) return null;
    return messaging.send({
      topic,
      notification: { title: notification.title, body: notification.body, imageUrl: notification.imageUrl },
      data: notification.data,
    });
  }

  private resolveArg(value: NotificationArg, locale: string): string {
    if (value instanceof Date) return this.formatDate(value, locale);
    if (isText(value)) return this.i18n.translate(value.key.startsWith('errors.') ? value.key : `notifications.${value.key}`, { locale, args: value.args });
    return String(value);
  }

  private async saveDeviceTokens(userId: string, tokens: string[]): Promise<void> {
    const key = deviceTokensKey(userId);
    if (!tokens.length) {
      await this.cacheManager.del(key);
      return;
    }
    await this.cacheManager.set(key, tokens, DEVICE_TOKENS_TTL_MS);
  }

  private messaging(): Messaging | null {
    if (this.firebase !== undefined) return this.firebase;
    try {
      const app: App = getApps().some((existing) => existing.name === FIREBASE_APP_NAME)
        ? getApp(FIREBASE_APP_NAME)
        : initializeApp({ credential: cert(this.loadServiceAccount()) }, FIREBASE_APP_NAME);
      this.firebase = getMessaging(app);
    } catch (error) {
      this.logger.warn(`Push notifications are disabled: ${(error as Error).message}`);
      this.firebase = null;
    }
    return this.firebase;
  }

  private loadServiceAccount(): ServiceAccount {
    const projectId = this.configService.get<string>('app.firebase.projectId');
    const clientEmail = this.configService.get<string>('app.firebase.clientEmail');
    const privateKey = this.configService.get<string>('app.firebase.privateKey');
    if (projectId && clientEmail && privateKey) return { projectId, clientEmail, privateKey };

    const path = resolve(this.configService.get<string>('app.firebase.serviceAccountPath') ?? 'source/configuration/_firebase.configuration.json');
    const raw = JSON.parse(readFileSync(path, 'utf8')) as { project_id: string; client_email: string; private_key: string };
    return { projectId: raw.project_id, clientEmail: raw.client_email, privateKey: raw.private_key };
  }
}
