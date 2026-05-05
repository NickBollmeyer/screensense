# ScreenSense — Habit Tracking App PRD

## Overview
ScreenSense is an Android-targeted Expo React Native habit tracking app that automatically monitors phone usage and helps users build healthier digital habits. It splits the day into Task vs Fun activities, breaks down usage by category and individual apps, tracks calls, and provides AI-powered insights.

## Core Features
1. **Onboarding & Permission Flow** — Elegant intro screen explaining Usage Access permission (`/index.tsx`).
2. **Dashboard (Today tab)** — Hero ring showing total screen time, Task vs Fun bar, quick stats (pickups, notifications, calls), week trend chart, and top categories.
3. **Apps tab** — Searchable list of every app used today, filterable by category, with per-app duration and launch counts.
4. **Insights tab** — AI-generated wellness score (0–100), highlights, and personalised recommendations powered by Claude Sonnet 4.5 via the Emergent LLM key.
5. **Profile tab** — Profile card, daily category limits (goals) with full create/delete CRUD, settings entries.
6. **Category detail screen** (`/category/[id].tsx`) — Per-category 7-day trend with sparkline + bar chart and the apps used today in that category.

## Backend (FastAPI + MongoDB)
- `GET /api/categories` — 10 pre-defined categories.
- `GET /api/usage/today` — today's usage with category breakdown.
- `GET /api/usage/week` — last 7 days totals + Task/Fun split.
- `GET /api/usage/category/{id}` — single category detail with weekly trend.
- `POST /api/insights/generate` — generate AI insights (Claude Sonnet 4.5).
- `GET /api/insights/today` — cached insights for today.
- `POST/GET/DELETE /api/goals` — CRUD for daily category limits.
- `POST /api/seed` — seeds 7 days of mock data.

## Categorization Rules (pre-defined)
- **Task type**: Productivity, Communication, AI Tools, News & Reading, Health & Fitness.
- **Fun type**: Social Media, Entertainment, Gaming, Browsing, Shopping.

## Important Technical Notes
- **MOCKED DATA in preview**: Real Android `UsageStatsManager` integration only works on a built APK. The preview uses realistic mock data (last 7 days seeded automatically) so you can explore the full UI.
- AI insights via `emergentintegrations` library (`anthropic/claude-sonnet-4-5-20250929`).

## Tech Stack
- Frontend: Expo Router 6, React Native 0.81, react-native-svg, lucide-react-native, expo-blur.
- Backend: FastAPI, Motor (async MongoDB), emergentintegrations.
- Theme: Dark mode "Performance Pro" — Obsidian #0A0A0A background, Volt Blue #007AFF primary, neon green #00FF66 accent.

## Smart Business Enhancement
**ScreenSense Pro tier (future)** — Sell subscriptions for richer AI coaching: personalised week-over-week trend reports, app substitution suggestions ("swap 30 min of TikTok for a 15-min walk"), and family/team dashboards. Demonstrated revenue path while keeping the core tracker free.
