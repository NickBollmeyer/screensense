# ScreenSense — Launch Assets

This directory contains everything needed to publish ScreenSense to the Google Play Store.

## What's here

```
/app/
├── PRIVACY_POLICY.md          ← Markdown source for Play Console privacy URL
├── landing/                   ← Marketing site (screensense.app)
│   ├── index.html             ← One-pager: hero, stats, features, pricing, FAQ
│   └── privacy.html           ← Hosted privacy policy
├── play_store/                ← Play Store screenshot template
│   ├── index.html             ← 8 annotated 9:16 screenshots (live app via iframes)
│   └── raw/                   ← (empty — left for any pre-rendered images you add)
└── frontend/app/              ← The app itself
    ├── index.tsx              ← Welcome screen (first-launch only)
    ├── onboarding/shock.tsx   ← "150 days a year" shock screen
    ├── paywall.tsx            ← $29.99/yr paywall (soft-gated, skippable)
    └── (tabs)/                ← Today · Apps · Stats · Coach · Profile
```

## Onboarding flow (first launch only)

```
index → onboarding/shock → paywall → (tabs)
            ↑ stored in AsyncStorage as `screensense.onboarding_complete`
```

Subsequent launches skip directly to `(tabs)`.

## Pricing

| Plan    | Price        | Trial    |
| ------- | ------------ | -------- |
| Annual  | **$29.99/yr** (best value, save 50%)  | 7 days |
| Monthly | $4.99/mo     | 7 days   |

The paywall is **soft-gated** — users can tap "Continue with free version" to enter the app
without subscribing. Free tier is limited to 5 AI-coach messages/day, 2 goals, 7 days of stats.

## Generating Play Store screenshots

1. Make sure both servers are running:
   - Frontend (Expo web): port `3000` via supervisor
   - Static server: `cd /app && python3 -m http.server 8766`
2. Open `http://localhost:8766/play_store/index.html` in a desktop browser.
3. Each card is rendered at the 9:16 aspect ratio with the actual app embedded
   via iframe — take an OS-level screenshot of each card and crop to 1080×1920.
4. Upload to Play Console → Store presence → Main store listing → Phone screenshots.

## Generating the marketing site

The landing page is fully static HTML/CSS — drop it on any host:

```bash
# Local preview
cd /app/landing && python3 -m http.server 8765
# → http://localhost:8765/index.html
```

To publish to `screensense.app`:
- Upload `index.html` and `privacy.html` to your static host (Vercel, Netlify, GitHub Pages, S3+CF).
- No build step required — pure HTML/CSS with one Google Fonts request.

## Privacy policy URL (required by Play Console)

Use the hosted `https://screensense.app/privacy.html` (or any public URL of the file).
The Markdown source remains at `/app/PRIVACY_POLICY.md` for legal reference.
