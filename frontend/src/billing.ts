/**
 * Billing facade.
 *
 * - On a native Android build (APK / dev client) → uses `expo-iap` to talk
 *   directly to Google Play Billing for the subscription products. The backend
 *   `/api/billing/purchase` endpoint then verifies the purchase token against
 *   the Google Play Developer API.
 * - On Expo Go / web preview → uses the backend mock endpoints so the
 *   paywall UI can be exercised end-to-end without a Play account.
 *
 * The choice is made at runtime via Constants.executionEnvironment.
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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
  period: 'month' | 'year' | 'lifetime';
  trial_days: number;
  save_pct?: number;
  limited_to?: number;
};

export type FoundersStatus = {
  remaining: number;
  total: number;
  claimed: number;
  available: boolean;
  price_cents: number;
};

const PLAN_IDS = ['premium_monthly', 'premium_annual', 'premium_lifetime'];

const isNativeBuild =
  Platform.OS === 'android' &&
  Constants.executionEnvironment !== 'storeClient' && // not Expo Go
  Constants.appOwnership !== 'expo';

// ─── Backend helpers (used in both modes for status + verify) ──────────────
async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api/billing${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`${path} failed`);
  return res.json();
}

// ─── expo-iap wrapper (loaded lazily; only used on a real device build) ────
let iap: any = null;
async function getIap() {
  if (!isNativeBuild) return null;
  if (iap) return iap;
  try {
    iap = await import('expo-iap');
    await iap.initConnection();
  } catch (e) {
    console.warn('expo-iap unavailable', e);
    iap = null;
  }
  return iap;
}

// ─── Public API ────────────────────────────────────────────────────────────
export const billing = {
  getStatus: () => http<SubscriptionStatus>('/status'),

  getPlans: () => http<Plan[]>('/plans'),

  getFoundersStatus: () => http<FoundersStatus>('/founders_remaining'),

  /**
   * Start a 7-day free trial. On native builds, this triggers Google Play's
   * subscription purchase flow (which honors the configured introductory
   * trial offer). On Expo Go / web, the backend mocks the trial start.
   */
  startTrial: async (plan_id: string): Promise<SubscriptionStatus> => {
    const i = await getIap();
    if (i) {
      // 1. Fetch the subscription details from Play.
      const subs = await i.fetchProducts({ skus: PLAN_IDS, type: 'subs' });
      const sub = subs.find((s: any) => s.productId === plan_id || s.id === plan_id);
      if (!sub) throw new Error(`SKU ${plan_id} not configured in Play Console`);
      // 2. Trigger purchase. This shows the Play UI and the user accepts trial.
      const offerToken =
        sub.subscriptionOfferDetails?.[0]?.offerToken ||
        sub.subscriptionOfferDetailsAndroid?.[0]?.offerToken;
      const purchase = await i.requestPurchase({
        request: {
          android: {
            skus: [plan_id],
            subscriptionOffers: offerToken
              ? [{ sku: plan_id, offerToken }]
              : undefined,
          },
        },
        type: 'subs',
      });
      // 3. Send purchase token to our backend for server-side verification.
      const token =
        (purchase as any)?.purchaseToken ||
        (purchase as any)?.[0]?.purchaseToken;
      return http<SubscriptionStatus>('/purchase', {
        method: 'POST',
        body: JSON.stringify({ plan_id, purchase_token: token }),
      });
    }
    // Mock path
    return http<SubscriptionStatus>('/start_trial', {
      method: 'POST',
      body: JSON.stringify({ plan_id }),
    });
  },

  purchase: async (plan_id: string): Promise<SubscriptionStatus> => {
    return billing.startTrial(plan_id); // same flow on Play; trial is part of offer
  },

  cancel: async () => {
    // Subscriptions are cancelled in Google Play, not via the app.
    if (isNativeBuild) {
      const i = await getIap();
      if (i?.deepLinkToSubscriptions) {
        await i.deepLinkToSubscriptions({ skuAndroid: 'premium_annual' });
      }
    }
    return http<SubscriptionStatus>('/cancel', { method: 'POST' });
  },

  restore: async () => {
    const i = await getIap();
    if (i) {
      const purchases = await i.getAvailablePurchases();
      // Re-validate any active purchases against backend
      for (const p of purchases) {
        if (PLAN_IDS.includes(p.productId)) {
          await http<SubscriptionStatus>('/purchase', {
            method: 'POST',
            body: JSON.stringify({
              plan_id: p.productId,
              purchase_token: p.purchaseToken,
            }),
          });
        }
      }
    }
    return http<SubscriptionStatus>('/restore', { method: 'POST' });
  },

  reset: () => http('/reset', { method: 'POST' }), // dev only
};

export const formatPrice = (cents: number, currency = 'USD'): string => {
  const amount = cents / 100;
  if (currency === 'USD') return `$${amount.toFixed(2)}`;
  return `${amount.toFixed(2)} ${currency}`;
};

export const FREE_LIMITS = {
  COACH_MESSAGES_PER_DAY: 5,
  GOALS_MAX: 2,
  STATS_HISTORY_DAYS: 7, // free sees 7 days; Pro sees 30
};
