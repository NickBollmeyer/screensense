# ScreenSense — Step-by-Step Launch Guide (no-experience edition)

This guide assumes you have **never** used EAS, the Play Console, Vercel, or DNS before. Every command, every click, every screen you'll see is spelled out. Read straight through — total time is **~6–8 hours of attention spread over 3–7 days** (the wait is mostly Google reviewing).

## What you'll need before starting

| Thing | Where | Cost | Why |
|---|---|---|---|
| A computer with Node.js 18+ | https://nodejs.org/en/download | free | To run the build commands |
| A Google account | one you already have | free | For Play Console + Vercel |
| A Google Play Developer account | https://play.google.com/console/signup | **$25 one-time** | Required to publish |
| A domain `screensense.app` | namecheap / cloudflare / google domains | **~$15–30/yr** | For your marketing site |
| A credit/debit card | — | — | Play Console only |
| ~3 GB free disk space | — | — | Node modules + build cache |

> 💡 **You can skip the domain** and use the free `screensense.vercel.app` URL Vercel gives you. Just use that wherever this guide says `screensense.app`.

---

# Step 1 — Build the Android APK with EAS

**What this means in plain English:** EAS is Expo's free cloud service that compiles your code into an `.apk` file (the file Android installs from). You don't need an Android computer or Android Studio — Google's servers do it for you.

**Time:** ~30 min of clicking + ~15 min of waiting per build.

### 1.1 Install Node.js (skip if already installed)

1. Go to <https://nodejs.org/en/download> and download the **LTS** installer for your OS.
2. Run the installer with default options.
3. Open a terminal:
   - **macOS / Linux:** open the **Terminal** app
   - **Windows:** press `Win + R`, type `cmd`, hit Enter
4. Verify by typing:
   ```bash
   node --version
   ```
   You should see something like `v20.11.0`. If not, restart your terminal.

### 1.2 Install the EAS CLI

In the same terminal type:

```bash
npm install -g eas-cli
```

This adds the `eas` command globally. Wait for it to finish (no errors).

### 1.3 Create your free Expo account

1. Go to <https://expo.dev/signup>
2. Sign up with the **same Google email** you'll use for Play Console (makes your life easier later).
3. Confirm the email Expo sends you.

### 1.4 Log in from the terminal

```bash
eas login
```
- It asks for your Expo username/email and password.
- After success type `eas whoami` — it should print your username.

### 1.5 Connect this project to EAS

Navigate to the frontend folder:

```bash
cd /app/frontend
```

Then run:

```bash
eas init
```

You will be asked:
- **"Would you like to create a project for @yourusername/screensense?"** → press `y` Enter
- It automatically writes the project ID into `app.json` (replacing the placeholders `REPLACE_WITH_YOUR_EAS_PROJECT_ID` and `REPLACE_WITH_YOUR_EXPO_USERNAME`).

### 1.6 First build — the **preview APK**

```bash
eas build --platform android --profile preview
```

What you'll see:
1. **"Generate a new Android Keystore?"** → press `y` Enter. (Keystore = a digital signature so Google trusts updates. EAS stores it for free; you never have to manage it.)
2. EAS uploads your code to the cloud.
3. It prints a build URL like `https://expo.dev/accounts/yourname/projects/screensense/builds/abc123`. Open it in your browser to watch progress.
4. After **12–18 minutes** the build finishes and shows a **"Download"** button + a QR code.

### 1.7 Install the APK on your phone

- **Option A (easiest):** Scan the QR code with your phone camera.
- **Option B:** Tap the Download button, then transfer the file to your phone via Drive/email.

When you tap the .apk on your phone:
1. Android says **"Install unknown apps is blocked"** → tap Settings → enable "Allow from this source" for your file manager.
2. Tap **Install** → **Open**.
3. ScreenSense launches with the welcome screen → shock → paywall → tabs.

### 1.8 Grant the Usage Access permission

The app will ask for **Usage Access** (this is the special Android permission that lets it count screen time):
1. Tap "Grant access & continue" → it deep-links to Settings.
2. Find **ScreenSense** in the list, toggle it ON, press back.
3. The app now shows your real phone usage.

> ⚠️ If your real screen time still shows the mock data after granting, **fully close** the app (swipe it away from recents) and reopen it. The native module reads cached data on launch.

### 1.9 When you're ready for production — the **AAB build**

The Play Store requires an `.aab` (App Bundle), not `.apk`. Run:

```bash
eas build --platform android --profile production
```

Same flow, ~15 min. The output is what you'll upload to Play Console in **Step 5**.

> 💰 **Free tier:** EAS gives you 30 builds per month free. After that builds are queued or you upgrade ($19/mo). For launch you only need ~5 builds total.

---

# Step 2 — Create the two subscription products in Play Console

**What this means in plain English:** The app's paywall shows "$29.99/year" and "$4.99/month". Those products don't exist anywhere yet — Google needs you to set them up so when a user taps "Start trial", Google's billing UI knows what to charge. The product IDs **must match exactly** the strings in our code: `premium_monthly` and `premium_annual`.

**Time:** ~45 min the first time.

### 2.1 Pay the $25 Play Developer fee (one time, lifetime)

1. Go to <https://play.google.com/console/signup>
2. Sign in with your Google account.
3. Choose **"An organization"** if you have a company name, otherwise **"Yourself"**.
4. Pay **$25 USD** with a card. You'll get access in ~24 h (sometimes minutes).

### 2.2 Create the app

1. Inside Play Console click **"Create app"** (top-right).
2. Fill in:
   - **App name:** `ScreenSense`
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free (the subscription is a separate product)
   - Tick all four declaration checkboxes at the bottom
3. Click **Create app**.

### 2.3 Upload your AAB to a "Closed testing" track first (so you can test purchases)

1. Left sidebar → **Test and release → Testing → Closed testing**
2. Click **Create track** → name it "Internal QA" → **Create**
3. Click **Create new release**
4. Drag the `.aab` file from Step 1.9 into the upload box
5. Wait for it to scan (~1 min)
6. Release name: `1.0.0` · Notes: `Initial closed test`
7. **Save** → **Review release** → **Start rollout to Closed testing**
8. Add yourself as a tester:
   - Back to Closed testing → **Testers** tab
   - **Create email list** → name `qa-team` → paste your own email → Save
   - Tick that list under "Email lists"
   - Copy the **opt-in URL** at the bottom of the page — you'll use it on your phone to install via Play Store
9. On your phone, open the opt-in URL → "Become a tester" → click Play Store link. After ~30 min the app appears as a free download.

### 2.4 Now create the subscriptions

1. Left sidebar → **Monetize → Products → Subscriptions**
2. Click **Create subscription**
3. **Subscription details:**
   - Product ID: `premium_annual` ← **must be exactly this string**
   - Name: `Annual`
   - Description: `Full access to ScreenSense Pro, billed yearly.`
4. Click **Save**.
5. Inside that subscription page, click **Add base plan**:
   - **Base plan ID:** `annual-autorenew`
   - **Type:** Auto-renewing
   - **Renewal period:** 1 year
   - **Price:** $29.99 USD (use "Set prices" to apply across all countries automatically)
   - Save → click **Activate**
6. Inside that base plan, click **Add offer**:
   - **Offer ID:** `7day-trial`
   - **Eligibility:** Developer-determined → leave default
   - **Phases:** 7 days free trial → at $0 → then base plan kicks in
   - Save → **Activate**
7. Repeat 2–6 for the **monthly** plan:
   - Product ID: `premium_monthly` (exact)
   - Name: `Monthly`
   - Base plan ID: `monthly-autorenew`, period 1 month, price $4.99
   - Offer: `7day-trial`, 7 days free, then base plan

### 2.5 Verify the IDs match the code

Open `/app/frontend/src/billing.ts` and confirm line:
```ts
const PLAN_IDS = ['premium_monthly', 'premium_annual'];
```
matches what you typed in step 2.4. **Any mismatch = the paywall throws "SKU not configured" at runtime.**

---

# Step 3 — Get the Service Account JSON for `eas submit`

**What this means in plain English:** Right now the only way to upload an `.aab` to Play Store is by clicking buttons in Play Console (which you already did in 2.3). But for future updates you can run `eas submit` from your terminal and it does it for you — saves 10 min each time. To do that, Google needs a "robot account" (a service account) with permission to upload, and it gives you a JSON key file as proof of identity.

**Time:** ~20 min, one-time.

### 3.1 Create a Google Cloud project

1. Go to <https://console.cloud.google.com/projectcreate>
2. Project name: `screensense-publishing` → Create
3. Wait ~30s for it to be ready, then **select** that project at the top.

### 3.2 Enable the Android Publisher API

1. Sidebar → **APIs & Services → Library**
2. Search for **"Google Play Android Developer API"**
3. Click it → **Enable**.

### 3.3 Create the service account

1. Sidebar → **IAM & Admin → Service Accounts → Create service account**
2. **Name:** `eas-publisher` · ID will autofill · **Create and continue**
3. Skip the "Grant access" step → **Done**
4. You're now on the service-account list. Click on the new account.
5. **Keys** tab → **Add key → Create new key → JSON → Create**
6. A JSON file downloads. **Rename it** `google-service-account.json`.
7. **Move it to** `/app/frontend/google-service-account.json` on your computer.

> 🔒 **Never commit this file to GitHub.** Our `.gitignore` already excludes it, but double-check before pushing.

### 3.4 Grant the service account access to your Play app

1. Back in **Play Console** → **Setup → API access**
2. You'll see your service account email listed (e.g. `eas-publisher@screensense-publishing.iam.gserviceaccount.com`)
3. Click **Grant access** next to it
4. **App permissions** tab → tick **ScreenSense**
5. **Account permissions** tab → tick:
   - "View app information and download bulk reports"
   - "Manage testing tracks and edit tester lists"
   - "Release apps to testing tracks"
   - "Release to production, exclude devices, and use Play App Signing"
6. **Apply** → **Save changes**

### 3.5 Test that `eas submit` works

```bash
cd /app/frontend
eas submit --platform android --latest
```
- It picks your latest production build.
- Asks "Where to submit?" → choose **internal** track first (safest).
- ~5 min later the new version appears in Play Console → Internal testing.

---

# Step 4 — Deploy the marketing site to Vercel

**What this means in plain English:** Your landing page is just two HTML files. Vercel is a free service that hosts static files super fast worldwide. We push the files, Vercel gives us a URL, optionally we point our custom domain at it.

**Time:** ~25 min including DNS.

### 4.1 Sign up for Vercel (free)

1. Go to <https://vercel.com/signup>
2. Click **"Continue with Google"** and use your Google account.
3. Choose the **Hobby (free)** plan — no card needed.

### 4.2 Install the Vercel CLI

```bash
npm install -g vercel
```

### 4.3 Log in

```bash
vercel login
```
- Choose **"Continue with Google"** → it opens your browser → you click **Authorize** → terminal says "Success!".

### 4.4 Deploy the landing page

```bash
cd /app/landing
vercel
```

Answer the prompts:
- **"Set up and deploy?"** → `Y`
- **"Which scope?"** → your username (only one option)
- **"Link to existing project?"** → `N`
- **"What's your project's name?"** → `screensense`
- **"In which directory is your code?"** → press Enter (current dir)
- **"Want to modify settings?"** → `N`

After ~30 s it prints a URL like `https://screensense-xyz.vercel.app`. Open it — your landing page is live!

### 4.5 Promote the deployment to production

```bash
vercel --prod
```
This gives you `https://screensense.vercel.app` (your "production" URL). **Use this one** in the Play Store privacy-policy field if you don't have a custom domain.

### 4.6 (Optional) Connect your custom domain `screensense.app`

1. Buy `screensense.app` at any registrar (Namecheap, Cloudflare, Google Domains).
2. In **Vercel dashboard → screensense project → Settings → Domains**
3. Type `screensense.app` → **Add**
4. Vercel shows you DNS records to add — usually:
   ```
   Type: A     Name: @       Value: 76.76.21.21
   Type: CNAME Name: www     Value: cname.vercel-dns.com
   ```
5. Log into your registrar's DNS panel and add those exact records.
6. Back in Vercel → **Refresh** → wait 5 min – 24 h. Vercel auto-issues an HTTPS certificate.
7. `https://screensense.app` is now live with the green lock.

> 💡 Whenever you change `landing/index.html`, just run `vercel --prod` again from `/app/landing` to redeploy.

---

# Step 5 — Wire backend purchase verification (server-side trust)

**What this means in plain English:** Right now when a user buys, the app sends the purchase token to your backend, but the backend doesn't actually check with Google whether the token is real. A clever user could fake one. Step 5 makes the backend call Google directly to verify — same service-account JSON we made in Step 3 unlocks this.

**Time:** ~30 min.

### 5.1 Install Python dependencies (on your backend server)

If your backend is currently running locally:

```bash
cd /app/backend
pip install google-api-python-client google-auth
```

If it's running on a hosted platform (Render, Railway, Fly.io, etc.), add these two lines to `backend/requirements.txt`:

```txt
google-api-python-client
google-auth
```

…and trigger a redeploy.

### 5.2 Copy the service-account JSON to the backend

Take the same `google-service-account.json` from **Step 3.3** and place it next to `server.py` (i.e. `/app/backend/google-service-account.json`). On hosted platforms, upload it as a "secret file" — the exact name varies; the file just needs to be readable by the running process.

### 5.3 Replace the mock `record_purchase` with real verification

Open `/app/backend/billing.py`. Find the `@billing_router.post("/purchase")` block (around line 124). Replace **the entire function body** with:

```python
from googleapiclient.discovery import build
from google.oauth2 import service_account
import os

_SA_PATH = os.path.join(os.path.dirname(__file__), "google-service-account.json")
_SCOPES = ["https://www.googleapis.com/auth/androidpublisher"]
_PACKAGE = "app.screensense.android"
_play = None

def _play_client():
    global _play
    if _play is None:
        creds = service_account.Credentials.from_service_account_file(
            _SA_PATH, scopes=_SCOPES
        )
        _play = build("androidpublisher", "v3", credentials=creds, cache_discovery=False)
    return _play


@billing_router.post("/purchase")
async def record_purchase(body: PurchaseBody):
    if body.plan_id not in PLANS:
        raise HTTPException(400, "Invalid plan")
    if not body.purchase_token:
        raise HTTPException(400, "purchase_token missing")

    # Ask Google: is this token real and what's its expiry?
    try:
        result = _play_client().purchases().subscriptionsv2().get(
            packageName=_PACKAGE, token=body.purchase_token
        ).execute()
    except Exception as e:
        raise HTTPException(403, f"Play verification failed: {e}")

    line_items = result.get("lineItems", [])
    if not line_items:
        raise HTTPException(403, "No active line items in purchase")
    expiry_iso = line_items[0]["expiryTime"]            # e.g. "2026-06-05T10:00:00Z"
    state = result.get("subscriptionState", "")          # e.g. SUBSCRIPTION_STATE_ACTIVE

    expires_at = datetime.fromisoformat(expiry_iso.replace("Z", "+00:00"))
    now = datetime.now(timezone.utc)
    in_trial = state == "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" or "TRIAL" in state.upper()

    record = {
        "user_id": USER_ID,
        "plan_id": body.plan_id,
        "status": "active" if expires_at > now else "canceled",
        "in_trial": in_trial,
        "trial_used": True,
        "expires_at": expires_at,
        "auto_renewing": True,
        "purchase_token": body.purchase_token,
        "updated_at": now.isoformat(),
    }
    await db.subscriptions.update_one(
        {"user_id": USER_ID}, {"$set": record}, upsert=True
    )
    return await get_subscription_status()
```

### 5.4 Replace the `start_trial` mock too (optional but recommended)

You can keep the mock `/start_trial` for the in-Expo-Go preview, but on a real APK the trial happens **inside Google's purchase flow**, so the app calls `/purchase` (not `/start_trial`). Look at `frontend/src/billing.ts` — when `expo-iap` is available, `startTrial()` already routes to `/purchase`, so you actually don't need to change anything else.

### 5.5 Test it

1. On your test device (the one logged into the Play Store with a license-tester account — see Play Console → **Setup → License testing** → add your Gmail).
2. Open the app → tap "Start 7-day free trial".
3. Google's UI shows "$0.00 today, then $29.99/year" → Confirm.
4. The app should show "Trial activated".
5. Check your backend logs — you'll see `POST /api/billing/purchase` returning 200 with the real expiry date.

> ⚠️ License-tester accounts get **renewals every 5 minutes** instead of every year, so you can test the full lifecycle quickly. Production users get real billing cycles.

---

# Step 6 — Deploy the backend somewhere with HTTPS

**What this means in plain English:** Right now the FastAPI backend (the server the app talks to for AI Coach, billing, focus mode) only runs on this development machine at `localhost:8001`. Your published Android APK in production needs to call a **public HTTPS URL**. The cheapest, easiest way is **Render** — one click reads our `render.yaml`, builds a Docker image, gives you a free `*.onrender.com` URL, and includes a Mongo database.

**Time:** ~30 min the first time.

**Cost options:**
- Free tier — backend goes to sleep after 15 min idle, takes 30 sec to wake. OK for testing.
- $14/mo — $7 backend + $7 Mongo, always-on. Recommended once you have real users.

### 6.1 Push your code to GitHub (one-time)

Render deploys from a GitHub repo. If your code isn't on GitHub yet:
1. Sign in to <https://github.com> and click **+ → New repository**.
2. Name it `screensense` → Private → Create.
3. From the page GitHub shows you, copy the "push an existing repository" lines. They look like:
   ```bash
   cd /app
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/screensense.git
   git branch -M main
   git push -u origin main
   ```
   Run them in your terminal.

### 6.2 Sign up for Render

1. Go to <https://render.com/signup>
2. Continue with **GitHub** → grant Render access to your `screensense` repo.

### 6.3 One-click deploy via Blueprint

1. Open <https://dashboard.render.com/select-repo?type=blueprint>
2. Pick your `screensense` repo.
3. Render auto-detects `/app/backend/render.yaml` and shows two services:
   - **screensense-api** (Web Service)
   - **screensense-mongo** (Database)
4. **One field needs your input** — `EMERGENT_LLM_KEY`:
   - Get yours: <https://app.emergent.sh> → top-right profile → **Universal Key** → Copy
   - Paste it into the highlighted field on the Render page
5. Click **Apply**.
6. Render starts building. Watch progress in the dashboard — first build takes ~5 min.
7. Once "Live", click the URL at the top — you'll see `{"message":"ScreenSense API"}` (or the root response).

### 6.4 Connect a custom subdomain (optional)

To get `https://api.screensense.app` instead of `https://screensense-api.onrender.com`:

1. In Render → screensense-api → Settings → Custom Domains → **Add Custom Domain** → `api.screensense.app`
2. Render shows you a CNAME record: `api → screensense-api.onrender.com`
3. Add that record in your DNS panel (same registrar where you set up `screensense.app` in Step 4.6).
4. Wait 5 min – 1 h. Render auto-issues an HTTPS cert.

### 6.5 Update your APK to point at the new URL

Open `/app/frontend/eas.json` and confirm both `preview` and `production` profiles have:
```json
"env": {
  "EXPO_PUBLIC_BACKEND_URL": "https://api.screensense.app"
}
```
(Replace with `https://screensense-api.onrender.com` if you skipped 6.4.)

Then rebuild:
```bash
cd /app/frontend
eas build --platform android --profile production
```

The new APK now calls your live backend.

### 6.6 (Later, once Step 5 is done) Upload the service-account JSON as a Secret File

1. Render → screensense-api → Environment → **Add Secret File**
2. **Filename:** `google-service-account.json`
3. **Mount path:** `/etc/secrets/google-service-account.json`
4. Paste the JSON contents → Save
5. In `backend/billing.py`, change:
   ```python
   _SA_PATH = os.path.join(os.path.dirname(__file__), "google-service-account.json")
   ```
   to:
   ```python
   _SA_PATH = os.environ.get(
       "GOOGLE_SA_PATH",
       "/etc/secrets/google-service-account.json"
   )
   ```
6. `git push` → Render auto-redeploys.

### Alternative hosts (if Render isn't your style)

| Host | Config file already in repo | Pros | Cons |
|---|---|---|---|
| **Render** | `backend/render.yaml` | One-click blueprint, includes Mongo | Free tier sleeps |
| **Fly.io** | `backend/fly.toml` | Globally distributed, can scale to zero | Mongo is separate (use Atlas free) |
| **Railway** | `backend/railway.json` | Beautiful UI, easy env vars | $5/mo minimum |

For Fly.io:
```bash
brew install flyctl       # or curl -L https://fly.io/install.sh | sh
cd /app/backend
fly auth signup
fly launch --copy-config --name screensense-api --no-deploy
fly secrets set MONGO_URL="mongodb+srv://..." EMERGENT_LLM_KEY="emg-..."
fly deploy
fly certs add api.screensense.app
```

For Railway:
1. <https://railway.com/new> → Deploy from GitHub → pick `screensense` repo → root directory `/backend`
2. Add a Mongo database from the templates marketplace
3. Add env vars: `MONGO_URL` (from the Mongo service), `EMERGENT_LLM_KEY`, `PORT=8001`
4. Click Deploy.

---

# Day 1 launch checklist (now full)

1. ☐ AAB built and uploaded to Play Console Closed testing (§1.9, §2.3)
2. ☐ Subscriptions live with exact IDs `premium_monthly` and `premium_annual` (§2.4)
3. ☐ Service-account JSON saved & gitignored (§3.3)
4. ☐ Service-account granted access in Play Console (§3.4)
5. ☐ Backend deployed at `https://api.screensense.app` (§6)
6. ☐ Backend purchase verification wired (§5)
7. ☐ `eas.json` `production.env.EXPO_PUBLIC_BACKEND_URL` matches backend URL
8. ☐ Landing page deployed at `https://screensense.app` (§4)
9. ☐ Privacy URL set in Play Console listing → `https://screensense.app/privacy.html`
10. ☐ Terms URL referenced in app + listing → `https://screensense.app/terms.html`
11. ☐ Listing fields filled: name, short description, full description (`/app/play_store/listing_description.txt`)
12. ☐ Icon (`exports/app_icon_512.png`) and feature graphic (`exports/feature_graphic_1024x500.png`) uploaded
13. ☐ 8 phone screenshots (`exports/01_*.png` … `08_*.png`) uploaded
14. ☐ Test purchase made on a license-tester device → backend verifies → app unlocks Pro
15. ☐ Promote release **Closed → Open testing → Production**

First Google review: **2–7 days**. Updates after that: minutes to hours.

---

## Where to ask for help when stuck

| Issue | Where |
|---|---|
| Build fails on EAS | https://chat.expo.dev (Expo Discord, free, very active) |
| Play Console rejection | The rejection email tells you the exact policy and how to fix |
| Vercel deploy fails | https://vercel.com/help — paid plans have ticket support, free tier uses community |
| Anything code-level | DM me back here with the exact error message and I'll diagnose |

Good luck — you're closer than you think. The hardest parts (the app itself, the AI coach, the paywall flow) are already done.
