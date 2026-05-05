/**
 * UsageStats — local Expo Module for Android
 *
 * Reads aggregated app usage statistics from Android's `UsageStatsManager`.
 * Requires the `PACKAGE_USAGE_STATS` special permission, which the user must
 * grant manually in Settings → Apps → Special access → Usage access.
 *
 * On iOS, web, and Expo Go this module is unavailable and all functions
 * return `null` / `false` so the app can fall back to its mock data path.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform, Linking } from 'react-native';

export type AppUsage = {
  package_name: string;
  app_name: string;
  total_time_in_foreground: number; // milliseconds
  last_time_used: number;            // unix epoch ms
  launch_count?: number;
};

const Native = requireOptionalNativeModule('UsageStats');

/** Whether the native module is available (Android dev/prod build only). */
export function isAvailable(): boolean {
  return Platform.OS === 'android' && !!Native;
}

/** Has the user granted PACKAGE_USAGE_STATS? */
export async function hasPermission(): Promise<boolean> {
  if (!isAvailable()) return false;
  return Native.hasPermission();
}

/** Open the system Usage Access settings page. No-op when unavailable. */
export async function openSettings(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (isAvailable() && Native.openSettings) {
    return Native.openSettings();
  }
  // Fallback: app settings
  Linking.openSettings();
}

/**
 * Query daily aggregated usage between [startMs, endMs] (inclusive).
 * Returns null when the native module is unavailable so callers can fall
 * back to the backend mock path.
 */
export async function queryUsage(
  startMs: number,
  endMs: number
): Promise<AppUsage[] | null> {
  if (!isAvailable()) return null;
  try {
    const list: AppUsage[] = await Native.queryUsage(startMs, endMs);
    return list;
  } catch (e) {
    console.warn('UsageStats.queryUsage failed', e);
    return null;
  }
}

/** Convenience: query "today" so far, in the device's local timezone. */
export async function queryToday(): Promise<AppUsage[] | null> {
  const now = Date.now();
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return queryUsage(d.getTime(), now);
}

export default {
  isAvailable,
  hasPermission,
  openSettings,
  queryUsage,
  queryToday,
};
