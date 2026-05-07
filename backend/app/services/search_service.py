from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.dialects.sqlite import insert
import asyncio
from datetime import datetime

from app.models import Task, SearchJob, JobStatus
from app.scrapers.factory import ScraperFactory
from app.services.currency_service import CurrencyService


class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def search(self, keyword: str, platforms: List[str] = None) -> List[Dict]:
        job = SearchJob(
            keyword=keyword,
            platforms=platforms or ["all"],
            status=JobStatus.RUNNING.value
        )
        self.db.add(job)
        await self.db.flush()

        results = []
        target_platforms = ScraperFactory.all_platforms() if "all" in platforms else platforms

        for platform in target_platforms:
            try:
                scraper = ScraperFactory.create(platform)
                tasks = await scraper.scrape(keyword)
                for task in tasks:
                    results.append(await self._save_task(task))
            except Exception as e:
                print(f"Error scraping {platform}: {e}")

        job.status = JobStatus.COMPLETED.value
        job.completed_at = datetime.now()
        job.results_count = len(results)
        await self.db.commit()

        return results

    async def _save_task(self, task_data: Dict) -> Dict:
        reward_usd = CurrencyService.convert_to_usd(
            task_data["reward"],
            task_data.get("currency", "USD")
        )

        stmt = insert(Task).values(
            platform=task_data["platform"],
            task_id=task_data["task_id"],
            title=task_data["title"],
            description=task_data.get("description"),
            reward=task_data["reward"],
            currency=task_data.get("currency", "USD"),
            reward_usd=reward_usd,
            estimated_time=task_data.get("estimated_time"),
            url=task_data["url"],
            requirements=task_data.get("requirements", []),
            posted_at=task_data.get("posted_at"),
            category=task_data.get("category"),
            difficulty=task_data.get("difficulty", "medium"),
            rating=task_data.get("rating", 3.0),
        ).on_conflict_do_update(
            index_elements=["platform", "task_id"],
            set_={
                "title": stmt.excluded.title,
                "description": stmt.excluded.description,
                "reward": stmt.excluded.reward,
                "reward_usd": stmt.excluded.reward_usd,
                "estimated_time": stmt.excluded.estimated_time,
                "requirements": stmt.excluded.requirements,
                "scraped_at": datetime.now(),
                "rating": stmt.excluded.rating,
            }
        )

        await self.db.execute(stmt)
        await self.db.flush()

        return {**task_data, "reward_usd": reward_usd}

    async def get_tasks(
        self,
        keyword: Optional[str] = None,
        platform: Optional[str] = None,
        min_reward: Optional[float] = None,
        max_reward: Optional[float] = None,
        sort_by: str = "reward_usd",
        sort_order: str = "asc",
        page: int = 1,
        limit: int = 20
    ) -> List[Task]:
        query = select(Task)

        if keyword:
            query = query.filter(Task.title.ilike(f"%{keyword}%"))
        if platform:
            query = query.filter(Task.platform == platform)
        if min_reward:
            query = query.filter(Task.reward_usd >= min_reward)
        if max_reward:
            query = query.filter(Task.reward_usd <= max_reward)

        if sort_by == "reward_usd":
            query = query.order_by(Task.reward_usd.asc() if sort_order == "asc" else Task.reward_usd.desc())
        elif sort_by == "efficiency":
            query = query.order_by(Task.reward_usd / Task.estimated_time.asc() if sort_order == "asc" else (Task.reward_usd / Task.estimated_time).desc())
        else:
            query = query.order_by(Task.scraped_at.desc())

        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_task_count(self) -> int:
        result = await self.db.execute(select(Task))
        return len(result.scalars().all())

    async def delete_task(self, task_id: str) -> bool:
        result = await self.db.execute(delete(Task).where(Task.id == task_id))
        await self.db.commit()
        return result.rowcount > 0

    async def clear_all_tasks(self) -> int:
        result = await self.db.execute(delete(Task))
        await self.db.commit()
        return result.rowcount
