"""ScreenSense backend API tests"""
import os
import pytest
import requests
from datetime import date

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://habit-dashboard-app-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ----- Categories -----
class TestCategories:
    def test_get_categories(self, s):
        r = s.get(f"{API}/categories", timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 10
        ids = {c["id"] for c in data}
        for need in ["productivity", "communication", "social", "entertainment",
                     "gaming", "ai_tools", "browsing", "shopping", "news", "health"]:
            assert need in ids
        for c in data:
            for k in ("id", "name", "type", "color", "icon", "apps"):
                assert k in c
            assert c["type"] in ("task", "fun")


# ----- Usage today -----
class TestUsageToday:
    def test_today(self, s):
        r = s.get(f"{API}/usage/today", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("date", "total_seconds", "task_seconds", "fun_seconds",
                  "call_seconds", "call_count", "pickups", "notifications",
                  "categories", "apps"):
            assert k in d, f"missing {k}"
        assert d["date"] == date.today().isoformat()
        assert d["total_seconds"] > 0
        assert isinstance(d["categories"], list) and len(d["categories"]) > 0
        assert isinstance(d["apps"], list) and len(d["apps"]) > 0
        # categories have correct shape
        c0 = d["categories"][0]
        for k in ("id", "name", "type", "color", "icon", "duration_seconds", "app_count"):
            assert k in c0
        # apps shape
        a0 = d["apps"][0]
        for k in ("app_name", "package_name", "category_id", "duration_seconds", "launches"):
            assert k in a0
        # sums must approximately match
        assert d["task_seconds"] + d["fun_seconds"] > 0


# ----- Week -----
class TestUsageWeek:
    def test_week(self, s):
        r = s.get(f"{API}/usage/week", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "days" in d
        assert len(d["days"]) == 7
        for day in d["days"]:
            for k in ("date", "day_label", "total_seconds", "task_seconds", "fun_seconds", "categories"):
                assert k in day
            assert day["total_seconds"] > 0


# ----- Category detail -----
class TestCategoryDetail:
    def test_valid_category(self, s):
        r = s.get(f"{API}/usage/category/social", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ("id", "name", "type", "color", "icon", "apps", "trend", "total_today"):
            assert k in d
        assert d["id"] == "social"
        assert len(d["trend"]) == 7
        for t in d["trend"]:
            assert "date" in t and "day_label" in t and "seconds" in t

    def test_invalid_category(self, s):
        r = s.get(f"{API}/usage/category/nonexistent", timeout=30)
        assert r.status_code == 404


# ----- Goals CRUD -----
class TestGoals:
    def test_goal_crud(self, s):
        # create
        r = s.post(f"{API}/goals", json={"category_id": "social", "daily_limit_minutes": 60}, timeout=30)
        assert r.status_code == 200, r.text
        goal = r.json()
        assert goal["category_id"] == "social"
        assert goal["daily_limit_minutes"] == 60
        gid = goal["id"]

        # list and verify
        r = s.get(f"{API}/goals", timeout=30)
        assert r.status_code == 200
        items = r.json()
        assert any(g["id"] == gid for g in items)

        # delete
        r = s.delete(f"{API}/goals/{gid}", timeout=30)
        assert r.status_code == 200
        assert r.json().get("deleted", 0) == 1

        # verify gone
        r = s.get(f"{API}/goals", timeout=30)
        assert all(g["id"] != gid for g in r.json())

    def test_invalid_category_goal(self, s):
        r = s.post(f"{API}/goals", json={"category_id": "bogus", "daily_limit_minutes": 10}, timeout=30)
        assert r.status_code == 400


# ----- Insights (AI - real LLM call) -----
class TestInsights:
    def test_insights_today(self, s):
        r = s.get(f"{API}/insights/today", timeout=120)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("date", "summary", "highlights", "recommendations", "score"):
            assert k in d, f"missing {k}"
        assert isinstance(d["summary"], str) and len(d["summary"]) > 0
        assert isinstance(d["highlights"], list) and len(d["highlights"]) >= 1
        assert isinstance(d["recommendations"], list) and len(d["recommendations"]) >= 1
        assert isinstance(d["score"], int)
        assert 0 <= d["score"] <= 100

    def test_insights_generate(self, s):
        r = s.post(f"{API}/insights/generate", timeout=120)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "summary" in d and "score" in d
        assert 0 <= d["score"] <= 100
