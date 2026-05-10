# ScreenSense — Test Credentials

The app uses a single seeded user — no auth required for the preview environment.

| Field      | Value          | Notes                                          |
| ---------- | -------------- | ---------------------------------------------- |
| user_id    | `default_user` | Auto-seeded on first backend boot              |
| Onboarding | resets via     | clearing `localStorage` key `screensense.onboarding_complete` |
| Billing    | resets via     | `POST /api/billing/reset` (dev only)           |

There are no email/password credentials in this app.
