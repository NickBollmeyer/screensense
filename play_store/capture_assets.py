"""Render icon (512x512) and feature graphic (1024x500) as PNG."""
import asyncio, os
from playwright.async_api import async_playwright

OUT = "/app/play_store/exports"
os.makedirs(OUT, exist_ok=True)

JOBS = [
    ("icon.html", 512, 512, "app_icon_512.png"),
    ("feature_graphic.html", 1024, 500, "feature_graphic_1024x500.png"),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for src, w, h, out_name in JOBS:
            ctx = await browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
            page = await ctx.new_page()
            url = f"http://localhost:8766/play_store/{src}"
            print(f"→ {out_name} ({w}x{h})")
            await page.goto(url, wait_until="networkidle", timeout=20000)
            await page.wait_for_timeout(800)
            out = f"{OUT}/{out_name}"
            await page.screenshot(path=out, omit_background=False, clip={"x": 0, "y": 0, "width": w, "height": h})
            print(f"   saved {out} ({os.path.getsize(out)//1024} KB)")
            await ctx.close()
        await browser.close()

asyncio.run(main())
