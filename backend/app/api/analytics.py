from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.api.deps import get_db_session
from app.services.analytics_service import AnalyticsService
from app.schemas.task import TaskResponse

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db_session)):
    analytics_service = AnalyticsService(db)
    return await analytics_service.get_summary_stats()


@router.get("/platform-distribution")
async def get_platform_distribution(db: AsyncSession = Depends(get_db_session)):
    analytics_service = AnalyticsService(db)
    return await analytics_service.get_platform_distribution()


@router.get("/reward-distribution")
async def get_reward_distribution(db: AsyncSession = Depends(get_db_session)):
    analytics_service = AnalyticsService(db)
    return await analytics_service.get_reward_distribution()


@router.get("/efficiency-distribution")
async def get_efficiency_distribution(db: AsyncSession = Depends(get_db_session)):
    analytics_service = AnalyticsService(db)
    return await analytics_service.get_efficiency_distribution()


@router.get("/difficulty-distribution")
async def get_difficulty_distribution(db: AsyncSession = Depends(get_db_session)):
    analytics_service = AnalyticsService(db)
    return await analytics_service.get_difficulty_distribution()


@router.get("/recommendations", response_model=List[TaskResponse])
async def get_recommendations(
    limit: int = 5,
    db: AsyncSession = Depends(get_db_session),
):
    analytics_service = AnalyticsService(db)
    return await analytics_service.get_recommendations(limit=limit)
