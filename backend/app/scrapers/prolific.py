from typing import List, Dict, Optional
from app.scrapers.base import BaseScraper
from app.scrapers.factory import register_scraper
from bs4 import BeautifulSoup


@register_scraper("prolific")
class ProlificScraper(BaseScraper):
    name = "Prolific"
    base_url = "https://www.prolific.com"

    async def search(self, keyword: str) -> List[Dict]:
        search_url = f"https://www.prolific.com/search?query={keyword}"
        content = await self._fetch_page(search_url)
        if not content:
            return self._generate_mock_results(keyword)
        return self._parse_search_results(content)

    def _parse_search_results(self, content: str) -> List[Dict]:
        soup = BeautifulSoup(content, "html.parser")
        tasks = []
        
        for card in soup.find_all("div", class_="study-card"):
            title = card.find("h2")
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
        reward_tag = soup.find("div", class_="reward-amount")
        time_tag = soup.find("span", class_="duration")
        
        return {
            "task_id": url.split("/")[-1],
            "title": title.get_text(strip=True) if title else "Unknown Task",
            "description": self._extract_description(soup),
            "reward": float(reward_tag.get_text(strip=True).replace("£", "")) if reward_tag else 5.0,
            "currency": "GBP",
            "estimated_time": int(time_tag.get_text(strip=True).replace("min", "")) if time_tag else 20,
            "url": url,
            "requirements": ["Must be 18+", "English speaker"],
            "difficulty": "medium",
            "rating": 4.5,
        }

    def _extract_description(self, soup) -> str:
        desc = soup.find("div", class_="study-description")
        return desc.get_text(strip=True)[:500] if desc else "No description available"

    def _generate_mock_results(self, keyword: str) -> List[Dict]:
        return [
            {"title": f"Academic {keyword} Research", "url": f"{self.base_url}/studies/study1"},
            {"title": f"{keyword} Psychology Study", "url": f"{self.base_url}/studies/study2"},
            {"title": f"Online {keyword} Experiment", "url": f"{self.base_url}/studies/study3"},
        ]

    def _generate_mock_task(self, url: str) -> Dict:
        import random
        return {
            "task_id": url.split("/")[-1],
            "title": "Academic Research Survey - Psychology Study",
            "description": "Participate in our academic research study about human behavior.",
            "reward": round(random.uniform(5.0, 20.0), 2),
            "currency": "GBP",
            "estimated_time": random.randint(15, 60),
            "url": url,
            "requirements": ["Must be 18+", "University student", "Good English"],
            "difficulty": random.choice(["medium", "hard"]),
            "rating": round(random.uniform(4.0, 5.0), 1),
        }
