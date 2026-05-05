/**
 * Native usage stats helper.
 *
 * In Expo Go / web preview, native UsageStatsManager is unavailable so this
 * resolves to `null` and the app uses the backend-served mock data.
 *
 * In an APK build (development build / prod build), wire a config plugin that
 * exposes a native module called `ExpoUsageStats` with a method `query(start, end)`
 * that returns a list of { app_name, package_name, total_time_in_foreground, last_used }.
 *
 * Required Android permission (already declared in app.json):
 *   android.permission.PACKAGE_USAGE_STATS  (special permission - user must
 *   grant via Settings → Apps → Special access → Usage access)
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type NativeAppUsage = {
  app_name: string;
  package_name: string;
  total_time_in_foreground: number; // ms
  last_used: number;                // unix ms
};

const isExpoGo =
  Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';

export const nativeUsageAvailable = () => {
  if (Platform.OS !== 'android') return false;
  if (isExpoGo) return false;
  // When the native module is registered, this becomes true.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  try {
    // Lazy require to avoid bundler errors in environments without the module
    const native = (global as any).ExpoUsageStatsModule || null;
    return !!native;
  } catch {
    return false;
  }
};

export async function queryNativeUsage(
  startMs: number,
  endMs: number
): Promise<NativeAppUsage[] | null> {
  if (!nativeUsageAvailable()) return null;
  try {
    const native = (global as any).ExpoUsageStatsModule;
    return await native.query(startMs, endMs);
  } catch (e) {
    console.warn('native usage query failed', e);
    return null;
  }
}

/** Call this from the onboarding screen to deep-link the user to the
 *  Usage Access settings on Android. On Expo Go this is a no-op. */
export async function openUsageAccessSettings(): Promise<void> {
  if (Platform.OS !== 'android' || isExpoGo) return;
  try {
    const Linking = await import('expo-linking');
    await Linking.openSettings();
  } catch (e) {
    console.warn('cannot open settings', e);
  }
}
