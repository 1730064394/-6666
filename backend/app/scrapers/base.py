from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from playwright.async_api import async_playwright, Browser, Page
import asyncio
import random
from app.config import settings


class BaseScraper(ABC):
    name: str
    base_url: str

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.delay_min = settings.SCRAPER_DELAY_MIN
        self.delay_max = settings.SCRAPER_DELAY_MAX

    async def _random_delay(self):
        delay = random.uniform(self.delay_min, self.delay_max)
        await asyncio.sleep(delay)

    async def _init_browser(self):
        if not self.browser:
            p = await async_playwright().start()
            self.browser = await p.chromium.launch(headless=True)
        return self.browser

    async def _close_browser(self):
        if self.browser:
            await self.browser.close()
            self.browser = None

    async def _create_page(self) -> Page:
        browser = await self._init_browser()
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1920, "height": 1080})
        return page

    async def _fetch_page(self, url: str) -> Optional[str]:
        page = await self._create_page()
        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
            content = await page.content()
            return content
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None
        finally:
            await page.close()

    @abstractmethod
    async def search(self, keyword: str) -> List[Dict]:
        pass

    @abstractmethod
    async def get_task_details(self, task_url: str) -> Optional[Dict]:
        pass

    async def scrape(self, keyword: str) -> List[Dict]:
        tasks = await self.search(keyword)
        results = []
        for task in tasks:
            details = await self.get_task_details(task.get("url", ""))
            if details:
                details["platform"] = self.name
                results.append(details)
            await self._random_delay()
        await self._close_browser()
        return results
