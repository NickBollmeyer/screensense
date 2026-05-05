"""Iteration 2: month, focus_mode, coach chat, goal-progress on /usage/today"""
import os
import pytest
import requests
from datetime import date

BASE_URL = os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL",
    "https://habit-dashboard-app-1.preview.emergentagent.com",
).rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ---------------- /api/usage/month ----------------
class TestUsageMonth:
    def test_month_shape(self, s):
        r = s.get(f"{API}/usage/month", timeout=60)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "days" in d and "summary" in d
        assert len(d["days"]) == 30
        for day in d["days"]:
            for k in ("date", "day", "weekday", "total_seconds"):
                assert k in day, f"missing {k} on day {day}"
            assert 0 <= day["weekday"] <= 6
            assert 1 <= day["day"] <= 31
        # summary fields
        summ = d["summary"]
        for k in ("total_seconds", "avg_seconds", "best_day", "worst_day"):
            assert k in summ, f"missing summary.{k}"
        assert summ["total_seconds"] >= 0
        assert summ["best_day"] is None or "date" in summ["best_day"]
        assert summ["worst_day"] is None or "date" in summ["worst_day"]
        # last day should be today
        assert d["days"][-1]["date"] == date.today().isoformat()

    def test_no_object_id_leak(self, s):
        r = s.get(f"{API}/usage/month", timeout=30)
        assert '"_id"' not in r.text


# ---------------- /api/focus_mode ----------------
class TestFocusMode:
    def test_get_creates_default(self, s):
        r = s.get(f"{API}/focus_mode", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("enabled", "start_hour", "end_hour", "silenced_categories"):
            assert k in d, f"missing {k}"
        assert isinstance(d["enabled"], bool)
        assert 0 <= d["start_hour"] <= 23
        assert 0 <= d["end_hour"] <= 23
        assert isinstance(d["silenced_categories"], list)
        assert '"_id"' not in r.text

    def test_put_partial_update(self, s):
        # enable + change hours
        r = s.put(
            f"{API}/focus_mode",
            json={"enabled": True, "start_hour": 8, "end_hour": 18,
                  "silenced_categories": ["social", "entertainment"]},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["enabled"] is True
        assert d["start_hour"] == 8
        assert d["end_hour"] == 18
        assert set(d["silenced_categories"]) == {"social", "entertainment"}

        # partial update only enabled
        r = s.put(f"{API}/focus_mode", json={"enabled": False}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["enabled"] is False
        # unchanged fields persisted
        assert d["start_hour"] == 8
        assert d["end_hour"] == 18
        assert set(d["silenced_categories"]) == {"social", "entertainment"}

        # GET reflects persistence
        r = s.get(f"{API}/focus_mode", timeout=30)
        d = r.json()
        assert d["enabled"] is False
        assert d["start_hour"] == 8


# ---------------- Goal progress on /usage/today ----------------
class TestGoalProgressOnToday:
    def test_goal_fields_attached(self, s):
        # Create a small goal so it is exceeded
        r = s.post(
            f"{API}/goals",
            json={"category_id": "social", "daily_limit_minutes": 5},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        gid = r.json()["id"]
        try:
            r = s.get(f"{API}/usage/today", timeout=30)
            assert r.status_code == 200
            d = r.json()
            social = next((c for c in d["categories"] if c["id"] == "social"), None)
            assert social is not None, "social category should exist in today"
            assert social.get("goal_minutes") == 5
            assert "goal_progress" in social
            assert social.get("goal_exceeded") is True
            # categories without a goal should NOT have goal_minutes set
            other = next(
                (c for c in d["categories"] if c["id"] not in ("social",)),
                None,
            )
            assert other is not None
            assert "goal_minutes" not in other
        finally:
            s.delete(f"{API}/goals/{gid}", timeout=30)


# ---------------- Coach chat ----------------
class TestCoach:
    def test_clear_then_send_then_history(self, s):
        # Clear history first
        r = s.delete(f"{API}/coach/messages", timeout=30)
        assert r.status_code == 200

        r = s.get(f"{API}/coach/messages", timeout=30)
        assert r.status_code == 200
        assert r.json() == []

        # Send a message
        r = s.post(
            f"{API}/coach/chat",
            json={"text": "Quick tip to reduce social media?"},
            timeout=120,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert "user_message" in d and "assistant_message" in d
        um = d["user_message"]
        am = d["assistant_message"]
        assert um["role"] == "user"
        assert um["text"] == "Quick tip to reduce social media?"
        assert am["role"] == "assistant"
        assert isinstance(am["text"], str)
        assert len(am["text"]) > 10  # should be substantive (real or fallback both >10)

        # History should contain both
        r = s.get(f"{API}/coach/messages", timeout=30)
        assert r.status_code == 200
        msgs = r.json()
        assert len(msgs) >= 2
        roles = [m["role"] for m in msgs]
        assert "user" in roles and "assistant" in roles
        assert '"_id"' not in r.text

    def test_empty_message_rejected(self, s):
        r = s.post(f"{API}/coach/chat", json={"text": "   "}, timeout=30)
        assert r.status_code == 400

    def test_clear_messages(self, s):
        # ensure at least one message
        s.post(f"{API}/coach/chat", json={"text": "hi"}, timeout=120)
        r = s.delete(f"{API}/coach/messages", timeout=30)
        assert r.status_code == 200
        assert "deleted" in r.json()
        r = s.get(f"{API}/coach/messages", timeout=30)
        assert r.json() == []
