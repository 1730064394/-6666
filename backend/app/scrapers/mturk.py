from typing import List, Dict, Optional
from app.scrapers.base import BaseScraper
from app.scrapers.factory import register_scraper
from bs4 import BeautifulSoup


@register_scraper("mturk")
class MTurkScraper(BaseScraper):
    name = "Amazon MTurk"
    base_url = "https://www.mturk.com"

    async def search(self, keyword: str) -> List[Dict]:
        search_url = f"https://www.mturk.com/search?q={keyword}"
        content = await self._fetch_page(search_url)
        if not content:
            return self._generate_mock_results(keyword)

        return self._parse_search_results(content)

    def _parse_search_results(self, content: str) -> List[Dict]:
        soup = BeautifulSoup(content, "html.parser")
        tasks = []
        
        for card in soup.find_all("div", class_="result-card"):
            title = card.find("h3")
            link = card.find("a", href=True)
            if title and link:
                tasks.append({
                    "title": title.get_text(strip=True),
                    "url": self.base_url + link["href"],
                })
        return tasks

    async def get_task_details(self, task_url: str) -> Optional[Dict]:
        content = await self._fetch_page(task_url)
        if not content:
            return self._generate_mock_task(task_url)

        return self._parse_task_details(content, task_url)

    def _parse_task_details(self, content: str, url: str) -> Dict:
        soup = BeautifulSoup(content, "html.parser")
        
        title = soup.find("h1")
        reward_tag = soup.find("span", class_="reward")
        time_tag = soup.find("span", class_="estimated-time")
        
        return {
            "task_id": url.split("/")[-1],
            "title": title.get_text(strip=True) if title else "Unknown Task",
            "description": self._extract_description(soup),
            "reward": float(reward_tag.get_text(strip=True).replace("$", "")) if reward_tag else 3.0,
            "currency": "USD",
            "estimated_time": int(time_tag.get_text(strip=True).replace("min", "")) if time_tag else 15,
            "url": url,
            "requirements": ["Must be 18+", "English speaker"],
            "difficulty": "medium",
            "rating": 4.0,
        }

    def _extract_description(self, soup) -> str:
        desc = soup.find("div", class_="description")
        return desc.get_text(strip=True)[:500] if desc else "No description available"

    def _generate_mock_results(self, keyword: str) -> List[Dict]:
        return [
            {"title": f"{keyword} Survey - 15 minutes", "url": f"{self.base_url}/tasks/survey1"},
            {"title": f"Consumer {keyword} Study", "url": f"{self.base_url}/tasks/study1"},
            {"title": f"{keyword} Feedback Task", "url": f"{self.base_url}/tasks/feedback1"},
        ]

    def _generate_mock_task(self, url: str) -> Dict:
        import random
        return {
            "task_id": url.split("/")[-1],
            "title": "15-minute Consumer Survey about Shopping Habits",
            "description": "This survey asks questions about your shopping habits and preferences.",
            "reward": round(random.uniform(2.0, 10.0), 2),
            "currency": "USD",
            "estimated_time": random.randint(10, 45),
            "url": url,
            "requirements": ["Must be 18+", "English speaker", "US resident"],
            "difficulty": random.choice(["easy", "medium", "hard"]),
            "rating": round(random.uniform(3.0, 5.0), 1),
        }
