from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Emergent LLM key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="ScreenSense API")
api_router = APIRouter(prefix="/api")

# ============================================================
# CATEGORY DEFINITIONS - Pre-defined rules
# ============================================================
CATEGORIES = {
    "productivity": {
        "name": "Productivity",
        "type": "task",
        "color": "#00FF66",
        "icon": "briefcase",
        "apps": ["Gmail", "Outlook", "Slack", "Microsoft Teams", "Google Docs", "Notion", "Trello", "Asana", "Calendar", "Drive"],
    },
    "communication": {
        "name": "Communication",
        "type": "task",
        "color": "#007AFF",
        "icon": "message-circle",
        "apps": ["Messages", "WhatsApp", "Telegram", "Signal", "Phone", "Discord"],
    },
    "social": {
        "name": "Social Media",
        "type": "fun",
        "color": "#FF3B30",
        "icon": "users",
        "apps": ["Facebook", "Instagram", "Twitter", "TikTok", "Snapchat", "Messenger", "LinkedIn", "Reddit", "Pinterest"],
    },
    "entertainment": {
        "name": "Entertainment",
        "type": "fun",
        "color": "#FF9500",
        "icon": "film",
        "apps": ["YouTube", "Netflix", "Disney+", "Prime Video", "Hulu", "Spotify", "Apple Music"],
    },
    "gaming": {
        "name": "Gaming",
        "type": "fun",
        "color": "#AF52DE",
        "icon": "gamepad-2",
        "apps": ["PUBG", "Candy Crush", "Clash of Clans", "Roblox", "Among Us", "Fortnite", "Genshin Impact"],
    },
    "ai_tools": {
        "name": "AI Tools",
        "type": "task",
        "color": "#5AC8FA",
        "icon": "sparkles",
        "apps": ["ChatGPT", "Claude", "Gemini", "Perplexity", "Copilot", "Midjourney"],
    },
    "browsing": {
        "name": "Browsing",
        "type": "fun",
        "color": "#FFCC00",
        "icon": "globe",
        "apps": ["Chrome", "Firefox", "Safari", "Edge", "Brave", "Opera"],
    },
    "shopping": {
        "name": "Shopping",
        "type": "fun",
        "color": "#FF2D92",
        "icon": "shopping-bag",
        "apps": ["Amazon", "eBay", "Shein", "Temu", "Walmart", "Target"],
    },
    "news": {
        "name": "News & Reading",
        "type": "task",
        "color": "#34C759",
        "icon": "newspaper",
        "apps": ["BBC News", "CNN", "NY Times", "Medium", "Flipboard", "Pocket"],
    },
    "health": {
        "name": "Health & Fitness",
        "type": "task",
        "color": "#30D158",
        "icon": "heart-pulse",
        "apps": ["MyFitnessPal", "Strava", "Apple Health", "Google Fit", "Headspace", "Calm"],
    },
}


# ============================================================
# MODELS
# ============================================================
class AppUsage(BaseModel):
    app_name: str
    package_name: str = ""
    category_id: str
    duration_seconds: int  # seconds spent
    launches: int = 0
    last_used: Optional[str] = None  # ISO string


class DailyUsage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"
    date: str  # YYYY-MM-DD
    total_seconds: int
    apps: List[AppUsage]
    call_seconds: int = 0
    call_count: int = 0
    pickups: int = 0
    notifications: int = 0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class GoalCreate(BaseModel):
    category_id: str
    daily_limit_minutes: int


class Goal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"
    category_id: str
    daily_limit_minutes: int
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class InsightRequest(BaseModel):
    date: Optional[str] = None  # YYYY-MM-DD, defaults to today


class Insight(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"
    date: str
    summary: str
    highlights: List[str]
    recommendations: List[str]
    score: int  # 0-100 wellness score
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


# ============================================================
# MOCK DATA GENERATOR (for preview - real device data on APK build)
# ============================================================
def generate_mock_day(date_str: str, seed_offset: int = 0) -> DailyUsage:
    """Generate realistic mock usage data for a day."""
    random.seed(hash(date_str) + seed_offset)
    apps_data = []

    # Realistic distribution
    app_pool = [
        ("Instagram", "com.instagram.android", "social", 45 + random.randint(-15, 30)),
        ("YouTube", "com.google.android.youtube", "entertainment", 60 + random.randint(-20, 45)),
        ("WhatsApp", "com.whatsapp", "communication", 25 + random.randint(-10, 20)),
        ("Chrome", "com.android.chrome", "browsing", 35 + random.randint(-10, 25)),
        ("Gmail", "com.google.android.gm", "productivity", 18 + random.randint(-5, 15)),
        ("ChatGPT", "com.openai.chatgpt", "ai_tools", 22 + random.randint(-10, 30)),
        ("TikTok", "com.zhiliaoapp.musically", "social", 38 + random.randint(-15, 50)),
        ("Spotify", "com.spotify.music", "entertainment", 30 + random.randint(-10, 20)),
        ("Slack", "com.Slack", "productivity", 15 + random.randint(-5, 25)),
        ("Messages", "com.google.android.apps.messaging", "communication", 12 + random.randint(-5, 15)),
        ("Facebook", "com.facebook.katana", "social", 20 + random.randint(-10, 25)),
        ("Messenger", "com.facebook.orca", "social", 14 + random.randint(-5, 12)),
        ("Candy Crush", "com.king.candycrushsaga", "gaming", 18 + random.randint(-15, 35)),
        ("Notion", "notion.id", "productivity", 12 + random.randint(-5, 18)),
        ("Maps", "com.google.android.apps.maps", "browsing", 8 + random.randint(-3, 10)),
        ("Amazon", "com.amazon.mShop.android.shopping", "shopping", 10 + random.randint(-5, 15)),
        ("Calendar", "com.google.android.calendar", "productivity", 5 + random.randint(-2, 8)),
        ("Discord", "com.discord", "communication", 12 + random.randint(-5, 20)),
        ("Reddit", "com.reddit.frontpage", "social", 16 + random.randint(-8, 25)),
        ("Apple Health", "com.apple.health", "health", 4 + random.randint(-1, 6)),
    ]

    for name, pkg, cat, mins in app_pool:
        if mins <= 0:
            continue
        apps_data.append(AppUsage(
            app_name=name,
            package_name=pkg,
            category_id=cat,
            duration_seconds=max(0, mins) * 60,
            launches=random.randint(3, 35),
        ))

    total_seconds = sum(a.duration_seconds for a in apps_data)
    call_seconds = random.randint(10, 60) * 60
    call_count = random.randint(2, 12)

    return DailyUsage(
        date=date_str,
        total_seconds=total_seconds + call_seconds,
        apps=apps_data,
        call_seconds=call_seconds,
        call_count=call_count,
        pickups=random.randint(45, 130),
        notifications=random.randint(80, 220),
    )


async def ensure_mock_data():
    """Seed the last 7 days of mock data if DB is empty."""
    today = datetime.now(timezone.utc).date()
    for i in range(7):
        d = today - timedelta(days=i)
        date_str = d.isoformat()
        existing = await db.daily_usage.find_one({"date": date_str, "user_id": "default_user"}, {"_id": 0})
        if not existing:
            day = generate_mock_day(date_str, seed_offset=i)
            await db.daily_usage.insert_one(day.dict())


# ============================================================
# ROUTES
# ============================================================
@api_router.get("/")
async def root():
    return {"message": "ScreenSense API", "version": "1.0"}


@api_router.get("/categories")
async def get_categories():
    """Return all pre-defined categories."""
    return [{"id": cid, **cdata} for cid, cdata in CATEGORIES.items()]


@api_router.post("/seed")
async def seed_data():
    """Seed mock data for the last 7 days."""
    await ensure_mock_data()
    return {"status": "seeded"}


@api_router.get("/usage/today")
async def get_today_usage():
    """Get today's usage with category breakdown."""
    await ensure_mock_data()
    today_str = datetime.now(timezone.utc).date().isoformat()
    doc = await db.daily_usage.find_one({"date": today_str, "user_id": "default_user"}, {"_id": 0})
    if not doc:
        day = generate_mock_day(today_str)
        await db.daily_usage.insert_one(day.dict())
        doc = day.dict()

    # Build category breakdown
    cat_breakdown: Dict[str, Dict[str, Any]] = {}
    for app in doc["apps"]:
        cid = app["category_id"]
        if cid not in cat_breakdown:
            meta = CATEGORIES.get(cid, {"name": cid, "type": "fun", "color": "#888", "icon": "circle"})
            cat_breakdown[cid] = {
                "id": cid,
                "name": meta["name"],
                "type": meta["type"],
                "color": meta["color"],
                "icon": meta["icon"],
                "duration_seconds": 0,
                "app_count": 0,
            }
        cat_breakdown[cid]["duration_seconds"] += app["duration_seconds"]
        cat_breakdown[cid]["app_count"] += 1

    # Add call time as Communication category
    if doc.get("call_seconds", 0) > 0:
        if "communication" not in cat_breakdown:
            meta = CATEGORIES["communication"]
            cat_breakdown["communication"] = {
                "id": "communication",
                "name": meta["name"],
                "type": meta["type"],
                "color": meta["color"],
                "icon": meta["icon"],
                "duration_seconds": 0,
                "app_count": 0,
            }
        cat_breakdown["communication"]["duration_seconds"] += doc["call_seconds"]

    categories_list = sorted(cat_breakdown.values(), key=lambda x: x["duration_seconds"], reverse=True)

    task_seconds = sum(c["duration_seconds"] for c in categories_list if c["type"] == "task")
    fun_seconds = sum(c["duration_seconds"] for c in categories_list if c["type"] == "fun")

    return {
        "date": doc["date"],
        "total_seconds": doc["total_seconds"],
        "task_seconds": task_seconds,
        "fun_seconds": fun_seconds,
        "call_seconds": doc.get("call_seconds", 0),
        "call_count": doc.get("call_count", 0),
        "pickups": doc.get("pickups", 0),
        "notifications": doc.get("notifications", 0),
        "categories": categories_list,
        "apps": sorted(doc["apps"], key=lambda x: x["duration_seconds"], reverse=True),
    }


@api_router.get("/usage/week")
async def get_week_usage():
    """Get last 7 days of usage with daily totals."""
    await ensure_mock_data()
    today = datetime.now(timezone.utc).date()
    days = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        date_str = d.isoformat()
        doc = await db.daily_usage.find_one({"date": date_str, "user_id": "default_user"}, {"_id": 0})
        if not doc:
            continue
        # Build category split per day
        cat_seconds: Dict[str, int] = {}
        task_s, fun_s = 0, 0
        for app in doc["apps"]:
            cid = app["category_id"]
            cat_seconds[cid] = cat_seconds.get(cid, 0) + app["duration_seconds"]
            ctype = CATEGORIES.get(cid, {}).get("type", "fun")
            if ctype == "task":
                task_s += app["duration_seconds"]
            else:
                fun_s += app["duration_seconds"]
        days.append({
            "date": date_str,
            "day_label": d.strftime("%a"),
            "total_seconds": doc["total_seconds"],
            "task_seconds": task_s,
            "fun_seconds": fun_s,
            "categories": cat_seconds,
        })
    return {"days": days}


@api_router.get("/usage/category/{category_id}")
async def get_category_detail(category_id: str):
    """Get detail for a specific category - apps and weekly trend."""
    await ensure_mock_data()
    if category_id not in CATEGORIES:
        raise HTTPException(404, "Category not found")

    today = datetime.now(timezone.utc).date()
    today_str = today.isoformat()
    today_doc = await db.daily_usage.find_one({"date": today_str, "user_id": "default_user"}, {"_id": 0})

    apps_today = []
    if today_doc:
        apps_today = [a for a in today_doc["apps"] if a["category_id"] == category_id]
        apps_today.sort(key=lambda x: x["duration_seconds"], reverse=True)

    # Weekly trend
    trend = []
    for i in range(6, -1, -1):
        d = today - timedelta(days=i)
        date_str = d.isoformat()
        doc = await db.daily_usage.find_one({"date": date_str, "user_id": "default_user"}, {"_id": 0})
        secs = 0
        if doc:
            secs = sum(a["duration_seconds"] for a in doc["apps"] if a["category_id"] == category_id)
        trend.append({"date": date_str, "day_label": d.strftime("%a"), "seconds": secs})

    meta = CATEGORIES[category_id]
    return {
        "id": category_id,
        "name": meta["name"],
        "type": meta["type"],
        "color": meta["color"],
        "icon": meta["icon"],
        "apps": apps_today,
        "trend": trend,
        "total_today": sum(a["duration_seconds"] for a in apps_today),
    }


# ============================================================
# GOALS
# ============================================================
@api_router.post("/goals", response_model=Goal)
async def create_goal(input: GoalCreate):
    if input.category_id not in CATEGORIES:
        raise HTTPException(400, "Invalid category")
    # Upsert: replace if exists for the category
    await db.goals.delete_many({"user_id": "default_user", "category_id": input.category_id})
    goal = Goal(category_id=input.category_id, daily_limit_minutes=input.daily_limit_minutes)
    await db.goals.insert_one(goal.dict())
    return goal


@api_router.get("/goals")
async def list_goals():
    goals = await db.goals.find({"user_id": "default_user"}, {"_id": 0}).to_list(100)
    return goals


@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str):
    res = await db.goals.delete_one({"id": goal_id})
    return {"deleted": res.deleted_count}


# ============================================================
# AI INSIGHTS
# ============================================================
@api_router.post("/insights/generate")
async def generate_insights():
    """Generate AI-powered insights based on today's usage."""
    today_data = await get_today_usage()
    week_data = await get_week_usage()

    # Format usage for the LLM
    total_min = today_data["total_seconds"] // 60
    task_min = today_data["task_seconds"] // 60
    fun_min = today_data["fun_seconds"] // 60
    cats_summary = ", ".join([
        f"{c['name']}: {c['duration_seconds']//60}min" for c in today_data["categories"][:6]
    ])
    top_apps = ", ".join([
        f"{a['app_name']} ({a['duration_seconds']//60}min)" for a in today_data["apps"][:5]
    ])

    week_avg_min = 0
    if week_data["days"]:
        week_avg_min = sum(d["total_seconds"] for d in week_data["days"]) // (60 * len(week_data["days"]))

    prompt = f"""Analyze this user's phone usage for today and generate insights:

Today's stats:
- Total screen time: {total_min} minutes ({total_min//60}h {total_min%60}m)
- Productive (Task): {task_min} minutes
- Leisure (Fun): {fun_min} minutes
- Phone pickups: {today_data['pickups']}
- Notifications: {today_data['notifications']}
- Calls: {today_data['call_count']} calls, {today_data['call_seconds']//60} minutes total
- Categories breakdown: {cats_summary}
- Top apps: {top_apps}
- 7-day average: {week_avg_min} minutes/day

Respond in this EXACT JSON format (no markdown, no code fences):
{{
  "summary": "A friendly 1-2 sentence overview of today's digital habits",
  "highlights": ["3 specific observations from the data, each as a short sentence"],
  "recommendations": ["3 actionable, specific habit suggestions to improve digital wellness"],
  "score": <integer 0-100 representing digital wellness for the day>
}}

Be motivational, not judgmental. Reference specific numbers from the data."""

    summary_text = ""
    highlights: List[str] = []
    recommendations: List[str] = []
    score = 70

    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"insights-{today_data['date']}",
            system_message="You are a digital wellness coach. Be concise, specific, and motivational. Always respond with valid JSON only."
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        response = await chat.send_message(UserMessage(text=prompt))
        # Parse JSON from response
        import json
        import re
        text = response.strip()
        # Strip code fences if present
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        parsed = json.loads(text)
        summary_text = parsed.get("summary", "")
        highlights = parsed.get("highlights", [])
        recommendations = parsed.get("recommendations", [])
        score = int(parsed.get("score", 70))
    except Exception as e:
        logging.error(f"AI insight generation failed: {e}")
        # Fallback heuristics
        ratio = task_min / max(total_min, 1)
        score = max(20, min(95, int(50 + ratio * 50 - (fun_min - 120) * 0.1)))
        summary_text = f"You spent {total_min//60}h {total_min%60}m on your phone today, balancing {task_min}m of focused work with {fun_min}m of leisure."
        highlights = [
            f"You picked up your phone {today_data['pickups']} times today.",
            f"Top category: {today_data['categories'][0]['name']} at {today_data['categories'][0]['duration_seconds']//60} minutes." if today_data['categories'] else "No category data.",
            f"You received {today_data['notifications']} notifications.",
        ]
        recommendations = [
            "Try a 30-minute phone-free window after dinner.",
            "Batch notifications: silence non-essential apps during deep work.",
            "Replace 15 minutes of social scrolling with a short walk.",
        ]

    insight = Insight(
        date=today_data["date"],
        summary=summary_text,
        highlights=highlights,
        recommendations=recommendations,
        score=score,
    )
    # Cache
    await db.insights.delete_many({"user_id": "default_user", "date": today_data["date"]})
    await db.insights.insert_one(insight.dict())
    return insight


@api_router.get("/insights/today")
async def get_today_insights():
    """Get cached insights for today, or generate if missing."""
    today_str = datetime.now(timezone.utc).date().isoformat()
    cached = await db.insights.find_one({"user_id": "default_user", "date": today_str}, {"_id": 0})
    if cached:
        return cached
    return await generate_insights()


# ============================================================
# APP SETUP
# ============================================================
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    await ensure_mock_data()
    logger.info("Mock data seeded")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
