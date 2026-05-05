# ScreenSense — Launch Playbook

End-to-end checklist for getting ScreenSense onto the Google Play Store and live at `screensense.app`.

---

## 0 · One-time setup

### 0.1 · Create an Expo / EAS account (free)

```bash
# 1. Create account at https://expo.dev/signup (use the same email you'll use for Play Console)
# 2. Install the EAS CLI
npm install -g eas-cli

# 3. Log in
eas login
# → enter the credentials you just created

# 4. Verify
eas whoami
# → should print your username
```

### 0.2 · Link this project to an EAS project

```bash
cd /app/frontend
eas init
# → answer "Yes" to create a new EAS project
# → it will fill `expo.extra.eas.projectId` and `expo.owner` in app.json
```

After this, the placeholders `REPLACE_WITH_YOUR_EAS_PROJECT_ID` and `REPLACE_WITH_YOUR_EXPO_USERNAME` in `app.json` are filled automatically.

---

## 1 · Build the Android APK / AAB

### 1.1 · Quick preview APK (sideloadable, for you and beta testers)

```bash
cd /app/frontend
eas build --platform android --profile preview
```

Wait ~12–18 min. EAS:
1. Reads `app.json` + `eas.json`
2. Auto-prebuilds (no `android/` folder needed in repo — Continuous Native Generation)
3. Compiles the local `usage-stats` Kotlin module
4. Bundles in `expo-iap` for native Play Billing
5. Outputs an `.apk` URL you can install on any Android device

### 1.2 · Production AAB (for the Play Store)

```bash
eas build --platform android --profile production
```

Outputs an `.aab` (Android App Bundle) — this is what you upload to Play Console.

### 1.3 · Optional: submit straight from CLI

```bash
eas submit --platform android --latest
# Will prompt for a Google Play service account JSON — see § 2.3 below.
```

---

## 2 · Google Play Console setup

### 2.1 · Create the app

1. Go to <https://play.google.com/console> → **Create app**
2. App name: **ScreenSense**
3. Default language: English (US)
4. App type: **App**, Free
5. Content guidelines: tick all required boxes

### 2.2 · Configure subscriptions (so `expo-iap` can find them)

In Play Console → **Monetize → Products → Subscriptions** create **two** products with these **exact IDs** (must match `PLAN_IDS` in `frontend/src/billing.ts`):

| Product ID         | Name    | Base price | Trial offer |
| ------------------ | ------- | ---------- | ----------- |
| `premium_monthly`  | Monthly | $4.99/mo   | 7 days free |
| `premium_annual`   | Annual  | $29.99/yr  | 7 days free |

For each subscription:
- Add a **Base plan** (auto-renewing).
- Add an **Offer** with a free trial (7 days, eligible to new subscribers only).
- Activate both.

### 2.3 · Service account for `eas submit`

1. In Play Console → **Setup → API access → Create new service account**
2. Follow the wizard to Google Cloud → create a JSON key
3. Grant the service account "Release manager" role on the app
4. Save the JSON as `frontend/google-service-account.json` (already referenced in `eas.json`)
5. **Add this file to `.gitignore`** — never commit it.

### 2.4 · Backend purchase verification

When a user completes a purchase, the app POSTs the `purchase_token` to `/api/billing/purchase`. The current backend stores it. To verify it server-side against Google Play:

1. In `backend/billing.py → record_purchase()`, replace the mock with:
   ```python
   from googleapiclient.discovery import build
   from google.oauth2 import service_account
   creds = service_account.Credentials.from_service_account_file(
       'google-service-account.json',
       scopes=['https://www.googleapis.com/auth/androidpublisher'])
   service = build('androidpublisher', 'v3', credentials=creds)
   result = service.purchases().subscriptionsv2().get(
       packageName='app.screensense.android',
       token=body.purchase_token).execute()
   # Use result['lineItems'][0]['expiryTime'] for the real expiry.
   ```
2. `pip install google-api-python-client google-auth`
3. Mount the service account JSON read-only in your prod container.

---

## 3 · Marketing site (`screensense.app`)

The static one-pager lives in `/app/landing/`. Recommended host: **Vercel** (free, free SSL, free custom domain).

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Log in (creates a free account if needed)
vercel login

# 3. Deploy (run from /app/landing)
cd /app/landing
vercel --prod
# → answer the prompts, the result is a *.vercel.app URL

# 4. Add your custom domain
#    a. In Vercel dashboard → Project → Settings → Domains → Add screensense.app
#    b. Vercel shows you the DNS records to add at your registrar (A + CNAME)
#    c. Wait for DNS propagation (5 min – 48 h)
```

The bundled `vercel.json` already configures:
- Cache-Control headers for HTML
- Strict CSP / X-Frame-Options
- `/privacy` redirect to `/privacy.html`

Use **`https://screensense.app/privacy.html`** as the privacy-policy URL in the Play Console listing.

---

## 4 · Play Store listing assets

### 4.1 · 8 screenshots (already generated)

```
/app/play_store/exports/
├── 01_shock_150_days.png        (1080×1920)
├── 02_today_dashboard.png        (1080×1920)
├── 03_ai_coach.png               (1080×1920)
├── 04_thirty_day_heatmap.png     (1080×1920)
├── 05_auto_categories.png        (1080×1920)
├── 06_focus_mode.png             (1080×1920)
├── 07_pro_paywall.png            (1080×1920)
└── 08_private_by_design.png      (1080×1920)
```

Upload these to **Play Console → Main store listing → Phone screenshots**. Drag in order — the order is the order users see.

To **regenerate** them after design changes:
```bash
# Make sure expo (port 3000) and the static server are running
cd /app && python3 -m http.server 8766 &
cd /app/play_store && /opt/plugins-venv/bin/python capture.py
```

### 4.2 · Required text fields

| Field                | Suggested copy |
| -------------------- | -------------- |
| Short description (80 chars) | *Take back the hours your phone is stealing — with an AI habit coach.* |
| Full description     | See `/app/play_store/listing_description.txt` |
| App category         | Health & Fitness → subcategory: Self-improvement |
| Tags                 | screen time, digital wellness, habit tracker, AI coach, focus, productivity |
| Contact email        | `hello@screensense.app` |
| Privacy policy URL   | `https://screensense.app/privacy.html` |

### 4.3 · Other required art

You still need (Play Console will reject the listing without them):
- **App icon**: 512 × 512 PNG (32-bit, with alpha) — derive from `frontend/assets/images/icon.png`
- **Feature graphic**: 1024 × 500 PNG (no alpha) — recommend reusing the hero from `landing/index.html`

---

## 5 · Submit for review

1. Play Console → **Production → Create new release** → upload your `.aab`
2. Fill in release notes ("Initial launch — track your habits with an AI screen-time coach.")
3. Complete every red banner: Content rating, Target audience (18+), Data safety, Ads (no), App access
4. **Send for review** — first reviews take 2–7 days. Allow up to 14.

---

## 6 · Post-launch checklist

- [ ] DNS for `screensense.app` and `api.screensense.app` (the API) configured
- [ ] Backend deployed somewhere with HTTPS (`api.screensense.app`)
- [ ] `EXPO_PUBLIC_BACKEND_URL` in `eas.json` matches that URL
- [ ] Service-account JSON saved & **gitignored**
- [ ] Subscriptions activated in Play Console
- [ ] `google-api-python-client` purchase verification wired in `backend/billing.py`
- [ ] First test purchase made with a license-tester account (see Play Console → Setup → License testing)
- [ ] Crashlytics / Sentry enabled (optional but recommended)

---

## Files of interest

| Path                                             | What it is |
| ------------------------------------------------ | ---------- |
| `/app/frontend/app.json`                         | Expo manifest with Android permissions, plugins, package id |
| `/app/frontend/eas.json`                         | EAS Build profiles (dev / preview / production) |
| `/app/frontend/modules/usage-stats/`             | Local Expo Module (Kotlin) for `UsageStatsManager` |
| `/app/frontend/src/usageStats.ts`                | JS façade — falls back to mock on Expo Go / web |
| `/app/frontend/src/billing.ts`                   | Native `expo-iap` on APK, mock backend on Expo Go |
| `/app/landing/index.html`                        | Marketing one-pager |
| `/app/landing/privacy.html`                      | Hosted privacy policy |
| `/app/landing/vercel.json`                       | Vercel deploy config |
| `/app/play_store/exports/*.png`                  | 8 ready-to-upload screenshots |
| `/app/play_store/index.html`                     | Live preview of all 8 cards |
| `/app/play_store/single.html?n=1..8`             | Single-card export view (used by capture.py) |
| `/app/play_store/capture.py`                     | Re-render all 8 PNGs at 1080×1920 |
| `/app/PRIVACY_POLICY.md`                         | Markdown source (legal reference) |
| `/app/LAUNCH_PLAYBOOK.md`                        | (you are here) |
