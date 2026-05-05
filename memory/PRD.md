# ScreenSense — Habit Tracking App PRD (v1.1)

## Overview
ScreenSense is an Android-targeted Expo React Native habit tracking app that automatically monitors phone usage and helps users build healthier digital habits. Splits the day into Task vs Fun activities, breaks down usage by category and individual apps, tracks calls, surfaces AI insights, and lets users chat with an AI coach.

## App Structure (5 tabs)
1. **Today** — hero ring (red when total time over goal-ceiling), Task vs Fun bar, pickups/notifications/calls, week chart, top categories with **goal-progress** bars (red border + "OVER LIMIT" badge when exceeded). Auto-refreshes when tab regains focus.
2. **Apps** — searchable list of apps with category filter chips and per-app duration + launches.
3. **Stats** — wellness score (0-100, AI-generated), **30-day calendar heat-map** with intensity gradient, best/heaviest day cards, AI highlights & recommendations (Claude Sonnet 4.5).
4. **Coach** — Conversational AI chat with persistent history. Quick-prompts on empty state. Real Claude Sonnet 4.5 with usage data injected as context. Clear-thread button.
5. **Profile** — Profile card · **Focus mode** (toggle + start/end hour pickers + silenced category multi-select) · Daily-limit goals CRUD · Preferences (notifications, privacy, help).

Plus a stack screen `/category/[id]` with per-category 7-day sparkline + bar trend + apps list.

## Backend Endpoints (FastAPI + MongoDB)
- `GET /api/categories` — 10 pre-defined categories with type (task/fun), color, icon, app list.
- `GET /api/usage/today` — today's usage. Categories include `goal_minutes`, `goal_progress`, `goal_exceeded` when a goal is set.
- `GET /api/usage/week` — last 7 days totals + Task/Fun split.
- `GET /api/usage/month` — last 30 days for the heat-map; summary contains `total_seconds`, `avg_seconds`, `best_day`, `worst_day`.
- `GET /api/usage/category/{id}` — single category detail with weekly trend.
- `POST /api/insights/generate` / `GET /api/insights/today` — AI insights (Claude Sonnet 4.5).
- `POST /api/coach/chat` — sends a user message, returns user + assistant message. Real Claude Sonnet 4.5 with conversation history hydrated from MongoDB.
- `GET /api/coach/messages` / `DELETE /api/coach/messages` — list / clear chat history.
- `GET /api/focus_mode` (idempotent upsert) / `PUT /api/focus_mode` — focus-mode settings.
- `POST/GET/DELETE /api/goals` — daily category limits CRUD.
- `POST /api/seed` — re-seeds 30 days of mock data.

## Native Android UsageStatsManager (APK build)
- `app.json` declares `android.permission.PACKAGE_USAGE_STATS` (special permission), `READ_PHONE_STATE`, `READ_CALL_LOG`, `QUERY_ALL_PACKAGES`.
- `src/usageStats.ts` provides a thin helper: `nativeUsageAvailable()`, `queryNativeUsage(start, end)`, `openUsageAccessSettings()`. In Expo Go preview these are no-ops; in an APK / dev build the helper expects a `ExpoUsageStatsModule` global registered by a config plugin (todo for the APK build step).
- The preview continues to use backend-served mock data (30 days seeded automatically).

## AI Stack
- `emergentintegrations.llm.chat.LlmChat` with `anthropic/claude-sonnet-4-5-20250929` for both insights and coach chat. Coach hydrates last 10 messages of context into each turn.

## Smart Business Enhancement
**ScreenSense Pro tier**: monetize via subscription for richer Coach personality + week-over-week reports + family/team dashboards. Coach chat creates a strong daily-engagement loop that drives retention and a clear upgrade path.
