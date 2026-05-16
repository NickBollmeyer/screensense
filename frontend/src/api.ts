/**
 * API client with stale-while-revalidate caching.
 *
 * Cold-starts on Render's free tier can take 30-60s. To make the UI feel
 * snappy we keep an in-memory + AsyncStorage cache and return the cached
 * value immediately, then revalidate in the background.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
const CACHE_PREFIX = 'screensense.cache.';

type CacheEntry<T> = { value: T; at: number };
const mem = new Map<string, CacheEntry<any>>();

async function readCache<T>(key: string): Promise<CacheEntry<T> | null> {
  if (mem.has(key)) return mem.get(key) as CacheEntry<T>;
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (raw) {
      const entry = JSON.parse(raw) as CacheEntry<T>;
      mem.set(key, entry);
      return entry;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function writeCache<T>(key: string, value: T): Promise<void> {
  const entry: CacheEntry<T> = { value, at: Date.now() };
  mem.set(key, entry);
  try {
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    /* ignore quota errors */
  }
}

async function rawGet<T = any>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`);
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

/**
 * Stale-while-revalidate GET.
 *  - First call ever: waits for the network. (~30s on cold backend.)
 *  - Subsequent calls: resolves *instantly* with the cached payload, then
 *    fires a background fetch and updates the cache. The next call gets fresh.
 *  - If `maxAge` ms elapsed: behaves like the first call (waits).
 */
async function get<T = any>(
  path: string,
  opts: { maxAge?: number; force?: boolean } = {}
): Promise<T> {
  const cached = await readCache<T>(path);
  const fresh = cached && opts.maxAge && Date.now() - cached.at < opts.maxAge;

  if (cached && !opts.force) {
    // background refresh (don't await)
    if (!fresh) {
      rawGet<T>(path)
        .then((v) => writeCache(path, v))
        .catch(() => {});
    }
    return cached.value;
  }

  const value = await rawGet<T>(path);
  await writeCache(path, value);
  return value;
}

async function post<T = any>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  // any POST invalidates everything cached for related GETs
  mem.clear();
  AsyncStorage.getAllKeys().then((keys) => {
    const target = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (target.length) AsyncStorage.multiRemove(target).catch(() => {});
  });
  return res.json();
}

async function put<T = any>(path: string, body?: any): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

async function del<T = any>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`API ${path} failed: ${res.status}`);
  return res.json();
}

// Pre-warm the Render backend the moment the app boots. Fire-and-forget so the
// rest of the bundle doesn't have to wait for the cold start to finish.
if (BASE) {
  fetch(`${BASE}/api/`).catch(() => {
    /* ignore — we'll retry when a real request happens */
  });
}

export type CategoryMeta = {
  id: string;
  name: string;
  type: 'task' | 'fun';
  color: string;
  icon: string;
  apps: string[];
};

export type AppUsage = {
  app_name: string;
  package_name: string;
  category_id: string;
  duration_seconds: number;
  launches: number;
};

export type TodayUsage = {
  date: string;
  total_seconds: number;
  task_seconds: number;
  fun_seconds: number;
  call_seconds: number;
  call_count: number;
  pickups: number;
  notifications: number;
  categories: any[];
};

export type WeekDay = {
  date: string;
  day_label: string;
  total_seconds: number;
};

export const api = {
  getToday: () => get<TodayUsage>('/usage/today', { maxAge: 60_000 }),
  getWeek: () => get<{ days: WeekDay[] }>('/usage/week', { maxAge: 60_000 }),
  getMonth: () => get('/usage/month', { maxAge: 5 * 60_000 }),
  getCategories: () => get<CategoryMeta[]>('/categories', { maxAge: 60 * 60_000 }),
  getCategoryDetail: (id: string) =>
    get(`/categories/${id}`, { maxAge: 60_000 }),
  getApps: () => get<AppUsage[]>('/apps', { maxAge: 60_000 }),
  getGoals: () => get('/goals', { maxAge: 30_000 }),
  createGoal: (b: any) => post('/goals', b),
  deleteGoal: (id: string) => del(`/goals/${id}`),
  getFocusMode: () => get('/focus_mode', { maxAge: 30_000 }),
  updateFocusMode: (b: any) => put('/focus_mode', b),
  getInsightsToday: () => get('/insights/today', { maxAge: 30_000 }),
  getMessages: () => get('/coach/messages'),
  sendMessage: (b: any) => post('/coach/chat', b),
  clearChat: () => del('/coach/messages'),
  seed: () => post('/seed'),
};
