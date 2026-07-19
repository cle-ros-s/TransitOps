import { prisma } from '../../config/prismaClient';

const ALLOWED_SETTINGS_KEYS = [
  'depotName', 'currency', 'distanceUnit',
  'notifyLicenseExpiry', 'notifyMaintenance', 'notifyTripUpdates', 'notifyExpenses',
  'theme',
] as const;

type SettingKey = typeof ALLOWED_SETTINGS_KEYS[number];

export class SettingsService {
  async getAll(userId: string): Promise<Record<string, string>> {
    const settings = await prisma.settings.findMany({ where: { userId } });
    const result: Record<string, string> = {
      depotName: 'Main Depot',
      currency: 'INR',
      distanceUnit: 'km',
      notifyLicenseExpiry: 'true',
      notifyMaintenance: 'true',
      notifyTripUpdates: 'true',
      notifyExpenses: 'false',
      theme: 'light',
    };
    settings.forEach((s) => { result[s.key] = s.value; });
    return result;
  }

  async update(userId: string, updates: Record<string, string>): Promise<Record<string, string>> {
    const upsertOps = Object.entries(updates)
      .filter(([key]) => ALLOWED_SETTINGS_KEYS.includes(key as SettingKey))
      .map(([key, value]) =>
        prisma.settings.upsert({
          where: { userId_key: { userId, key } },
          create: { userId, key, value },
          update: { value },
        })
      );
    await prisma.$transaction(upsertOps);
    return this.getAll(userId);
  }
}

export const settingsService = new SettingsService();
