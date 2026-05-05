"""
Subscription endpoints for ScreenSense.

Real Google Play Billing verification requires `google-api-python-client`,
a service account with Android Publisher permissions, and a built APK.
In the preview environment we expose a MOCK billing endpoint that simulates
the full purchase + trial lifecycle so the paywall UI can be exercised
end-to-end. The frontend `billing` facade swaps to expo-iap automatically
when running in a development/production build.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from server import db  # reuse the same Motor client

billing_router = APIRouter(prefix="/api/billing", tags=["billing"])

USER_ID = "default_user"

PLANS = {
    "premium_monthly": {
        "id": "premium_monthly",
        "name": "Monthly",
        "price_cents": 499,
        "currency": "USD",
        "period": "month",
        "trial_days": 7,
    },
    "premium_annual": {
        "id": "premium_annual",
        "name": "Annual",
        "price_cents": 2999,
        "currency": "USD",
        "period": "year",
        "trial_days": 7,
        "save_pct": 50,
    },
}


class StartTrialBody(BaseModel):
    plan_id: str


class PurchaseBody(BaseModel):
    plan_id: str
    purchase_token: Optional[str] = None  # set by expo-iap in production


def _seconds(now: datetime, days: int) -> datetime:
    return now + timedelta(days=days)


@billing_router.get("/plans")
async def list_plans():
    return list(PLANS.values())


@billing_router.get("/status")
async def get_subscription_status():
    """Return current subscription state. Free if no record."""
    now = datetime.now(timezone.utc)
    doc = await db.subscriptions.find_one({"user_id": USER_ID}, {"_id": 0})
    if not doc:
        return {
            "tier": "free",
            "status": "none",
            "plan_id": None,
            "is_pro": False,
            "in_trial": False,
            "expires_at": None,
            "auto_renewing": False,
        }
    expires_at = doc.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    # MongoDB sometimes returns offset-naive datetimes — coerce to UTC.
    if isinstance(expires_at, datetime) and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    in_trial = doc.get("in_trial", False) and expires_at and expires_at > now
    active = expires_at and expires_at > now and doc.get("status") in ("trialing", "active")
    return {
        "tier": "pro" if active else "free",
        "status": doc.get("status", "none"),
        "plan_id": doc.get("plan_id"),
        "is_pro": bool(active),
        "in_trial": bool(in_trial),
        "expires_at": expires_at.isoformat() if expires_at else None,
        "auto_renewing": doc.get("auto_renewing", True),
    }


@billing_router.post("/start_trial")
async def start_trial(body: StartTrialBody):
    """Begin a 7-day free trial (no card required in preview)."""
    if body.plan_id not in PLANS:
        raise HTTPException(400, "Invalid plan")
    plan = PLANS[body.plan_id]
    now = datetime.now(timezone.utc)

    existing = await db.subscriptions.find_one({"user_id": USER_ID}, {"_id": 0})
    if existing and existing.get("status") in ("active", "trialing"):
        raise HTTPException(409, "Already subscribed")
    if existing and existing.get("trial_used"):
        raise HTTPException(409, "Trial already used. Upgrade directly.")

    record = {
        "user_id": USER_ID,
        "plan_id": body.plan_id,
        "status": "trialing",
        "in_trial": True,
        "trial_used": True,
        "trial_started_at": now.isoformat(),
        "expires_at": _seconds(now, plan["trial_days"]),
        "auto_renewing": True,
        "purchase_token": None,
        "updated_at": now.isoformat(),
    }
    await db.subscriptions.update_one(
        {"user_id": USER_ID}, {"$set": record}, upsert=True)
    return await get_subscription_status()


@billing_router.post("/purchase")
async def record_purchase(body: PurchaseBody):
    """
    Record a purchase. In production the `purchase_token` would be verified
    via the Google Play Developer API; the preview accepts any token.
    """
    if body.plan_id not in PLANS:
        raise HTTPException(400, "Invalid plan")
    plan = PLANS[body.plan_id]
    now = datetime.now(timezone.utc)
    days = 30 if plan["period"] == "month" else 365
    record = {
        "user_id": USER_ID,
        "plan_id": body.plan_id,
        "status": "active",
        "in_trial": False,
        "trial_used": True,
        "expires_at": _seconds(now, days),
        "auto_renewing": True,
        "purchase_token": body.purchase_token or f"mock-{plan['id']}-{int(now.timestamp())}",
        "updated_at": now.isoformat(),
    }
    await db.subscriptions.update_one(
        {"user_id": USER_ID}, {"$set": record}, upsert=True)
    return await get_subscription_status()


@billing_router.post("/cancel")
async def cancel_subscription():
    """Cancel auto-renew. User keeps access until expires_at."""
    now = datetime.now(timezone.utc)
    await db.subscriptions.update_one(
        {"user_id": USER_ID},
        {"$set": {"auto_renewing": False, "updated_at": now.isoformat()}}
    )
    return await get_subscription_status()


@billing_router.post("/restore")
async def restore_purchase():
    """Restore - in mock mode just returns current status."""
    return await get_subscription_status()


@billing_router.post("/reset")
async def reset_subscription():
    """DEV ONLY: clear subscription state so trial can be tested again."""
    await db.subscriptions.delete_many({"user_id": USER_ID})
    return {"reset": True}
