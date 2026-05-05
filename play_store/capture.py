"""Capture 8 Play Store screenshots at 1080×1920 from /play_store/single.html?n=1..8."""
import asyncio
import os
from playwright.async_api import async_playwright

OUT = "/app/play_store/exports"
os.makedirs(OUT, exist_ok=True)

NAMES = {
    1: "01_shock_150_days",
    2: "02_today_dashboard",
    3: "03_ai_coach",
    4: "04_thirty_day_heatmap",
    5: "05_auto_categories",
    6: "06_focus_mode",
    7: "07_pro_paywall",
    8: "08_private_by_design",
}


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
        page = await ctx.new_page()
        for n, name in NAMES.items():
            url = f"http://localhost:8766/play_store/single.html?n={n}"
            print(f"→ {name}")
            await page.goto(url, wait_until="networkidle", timeout=45000)
            await page.wait_for_timeout(6000)  # allow iframe contents (RN web bundle) to render
            out = f"{OUT}/{name}.png"
            await page.screenshot(path=out, clip={"x": 0, "y": 0, "width": 1080, "height": 1920})
            print(f"   saved {out} ({os.path.getsize(out)//1024} KB)")
        await browser.close()


asyncio.run(main())
