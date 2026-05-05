/**
 * Native usage stats helper.
 *
 * Wires the local Expo Module `usage-stats` (see /modules/usage-stats) which
 * exposes Android's `UsageStatsManager` to JS. The module is `requireOptional`
 * so this file is safe to import in Expo Go / web; functions resolve to
 * `null` / `false` and the app falls back to the backend mock data path.
 */
import { Platform } from 'react-native';

export type NativeAppUsage = {
  app_name: string;
  package_name: string;
  total_time_in_foreground: number; // ms
  last_time_used: number;            // unix ms
  launch_count?: number;
};

// Lazy / optional require — only evaluated on Android. On other platforms we
// short-circuit and never even touch the module so Metro doesn't try to bundle
// native-only code paths.
let mod: any = null;
function getMod() {
  if (Platform.OS !== 'android') return null;
  if (mod) return mod;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../modules/usage-stats/src').default;
  } catch {
    mod = null;
  }
  return mod;
}

export function nativeUsageAvailable(): boolean {
  const m = getMod();
  return !!m && m.isAvailable();
}

export async function hasUsageAccessPermission(): Promise<boolean> {
  const m = getMod();
  if (!m) return false;
  return m.hasPermission();
}

export async function openUsageAccessSettings(): Promise<void> {
  const m = getMod();
  if (m) return m.openSettings();
  // Web / Expo Go fallback — open the app's own settings page.
  try {
    const Linking = await import('expo-linking');
    Linking.openSettings();
  } catch {
    /* no-op */
  }
}

export async function queryNativeUsage(
  startMs: number,
  endMs: number
): Promise<NativeAppUsage[] | null> {
  const m = getMod();
  if (!m) return null;
  return m.queryUsage(startMs, endMs);
}

export async function queryTodayUsage(): Promise<NativeAppUsage[] | null> {
  const m = getMod();
  if (!m) return null;
  return m.queryToday();
}
