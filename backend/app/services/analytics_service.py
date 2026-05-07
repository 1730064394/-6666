from typing import Dict, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models import Task


class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_summary_stats(self) -> Dict[str, Any]:
        total_tasks = await self.db.scalar(select(func.count(Task.id)))
        avg_reward = await self.db.scalar(select(func.avg(Task.reward_usd)))
        avg_time = await self.db.scalar(select(func.avg(Task.estimated_time)))
        platforms = await self.db.execute(select(Task.platform).distinct())
        platform_count = len(platforms.scalars().all())

        return {
            "total_tasks": total_tasks or 0,
            "avg_reward_usd": round(avg_reward, 2) if avg_reward else 0.0,
            "avg_time_minutes": round(avg_time, 1) if avg_time else 0.0,
            "platform_count": platform_count,
        }

    async def get_platform_distribution(self) -> List[Dict[str, Any]]:
        query = select(
            Task.platform,
            func.count(Task.id).label("count"),
            func.avg(Task.reward_usd).label("avg_reward"),
        ).group_by(Task.platform)

        result = await self.db.execute(query)
        rows = result.all()

        return [
            {
                "platform": row.platform,
                "count": row.count,
                "avg_reward": round(row.avg_reward, 2) if row.avg_reward else 0.0,
            }
            for row in rows
        ]

    async def get_reward_distribution(self) -> List[Dict[str, Any]]:
        bins = [0, 2, 5, 10, 20, float("inf")]
        labels = ["$0-$2", "$2-$5", "$5-$10", "$10-$20", ">$20"]
        
        distribution = []
        for i in range(len(bins) - 1):
            query = select(func.count(Task.id)).filter(
                Task.reward_usd >= bins[i],
                Task.reward_usd < bins[i + 1]
            )
            count = await self.db.scalar(query)
            distribution.append({
                "range": labels[i],
                "count": count or 0,
            })
        
        return distribution

    async def get_efficiency_distribution(self) -> List[Dict[str, Any]]:
        query = select(Task.platform, Task.reward_usd, Task.estimated_time)
        result = await self.db.execute(query)
        rows = result.all()

        efficiency_by_platform = {}
        for row in rows:
            if row.estimated_time:
                efficiency = row.reward_usd / row.estimated_time
                if row.platform not in efficiency_by_platform:
                    efficiency_by_platform[row.platform] = []
                efficiency_by_platform[row.platform].append(efficiency)

        return [
            {
                "platform": platform,
                "avg_efficiency": round(sum(effs) / len(effs), 3),
                "count": len(effs),
            }
            for platform, effs in efficiency_by_platform.items()
        ]

    async def get_recommendations(self, limit: int = 5) -> List[Task]:
        query = select(Task).order_by(
            (Task.reward_usd / Task.estimated_time).desc()
        ).limit(limit)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_difficulty_distribution(self) -> List[Dict[str, Any]]:
        query = select(
            Task.difficulty,
            func.count(Task.id).label("count"),
            func.avg(Task.reward_usd).label("avg_reward"),
        ).group_by(Task.difficulty)

        result = await self.db.execute(query)
        rows = result.all()

        return [
            {
                "difficulty": row.difficulty or "unknown",
                "count": row.count,
                "avg_reward": round(row.avg_reward, 2) if row.avg_reward else 0.0,
            }
            for row in rows
        ]
