/**
 * Billing facade.
 *
 * In Expo Go / web preview: uses our backend mock endpoints so the paywall
 * UI can be exercised end-to-end without a Play account.
 *
 * In a production APK build: install `expo-iap` and replace `nativePurchase`
 * below with a real `requestPurchase` call. The backend `/api/billing/purchase`
 * will then verify the Google Play purchase token via the Android Publisher API.
 */
import { api } from './api';

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export type SubscriptionStatus = {
  tier: 'free' | 'pro';
  status: 'none' | 'trialing' | 'active' | 'canceled';
  plan_id: string | null;
  is_pro: boolean;
  in_trial: boolean;
  expires_at: string | null;
  auto_renewing: boolean;
};

export type Plan = {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  period: 'month' | 'year';
  trial_days: number;
  save_pct?: number;
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api/billing${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`${path} failed`);
  return res.json();
}

export const billing = {
  getStatus: () => http<SubscriptionStatus>('/status'),
  getPlans: () => http<Plan[]>('/plans'),
  startTrial: (plan_id: string) =>
    http<SubscriptionStatus>('/start_trial', {
      method: 'POST',
      body: JSON.stringify({ plan_id }),
    }),
  // In production, the purchase_token comes from expo-iap's requestPurchase result.
  purchase: (plan_id: string, purchase_token?: string) =>
    http<SubscriptionStatus>('/purchase', {
      method: 'POST',
      body: JSON.stringify({ plan_id, purchase_token }),
    }),
  cancel: () => http<SubscriptionStatus>('/cancel', { method: 'POST' }),
  restore: () => http<SubscriptionStatus>('/restore', { method: 'POST' }),
  reset: () => http('/reset', { method: 'POST' }), // dev only
};

export const formatPrice = (cents: number, currency = 'USD'): string => {
  const amount = cents / 100;
  if (currency === 'USD') return `$${amount.toFixed(2)}`;
  return `${amount.toFixed(2)} ${currency}`;
};

// ─── Pro feature gates (read by screens) ─────────────────────
export const FREE_LIMITS = {
  COACH_MESSAGES_PER_DAY: 5,
  GOALS_MAX: 2,
  STATS_HISTORY_DAYS: 7,   // free sees 7 days; Pro sees 30
};
