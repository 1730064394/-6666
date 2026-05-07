from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.api.deps import get_db_session
from app.services.search_service import SearchService
from app.schemas.search import SearchCreate, SearchResponse
from app.schemas.task import TaskResponse

router = APIRouter(prefix="/search", tags=["search"])


@router.post("/", response_model=SearchResponse)
async def search(
    search_request: SearchCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
):
    search_service = SearchService(db)
    
    background_tasks.add_task(
        search_service.search,
        search_request.keyword,
        search_request.platforms
    )
    
    return SearchResponse(
        job_id="background_job",
        status="running",
        message=f"Search started for '{search_request.keyword}'",
        keyword=search_request.keyword,
        started_at=__import__("datetime").datetime.now(),
    )


@router.get("/tasks", response_model=List[TaskResponse])
async def get_search_results(
    keyword: Optional[str] = None,
    platform: Optional[str] = None,
    min_reward: Optional[float] = None,
    max_reward: Optional[float] = None,
    sort_by: str = "reward_usd",
    sort_order: str = "asc",
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db_session),
):
    search_service = SearchService(db)
    tasks = await search_service.get_tasks(
        keyword=keyword,
        platform=platform,
        min_reward=min_reward,
        max_reward=max_reward,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )
    return tasks
