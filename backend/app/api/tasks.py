from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.api.deps import get_db_session
from app.services.search_service import SearchService
from app.schemas.task import TaskResponse

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db_session),
):
    search_service = SearchService(db)
    tasks = await search_service.get_tasks(page=page, limit=limit)
    return tasks


@router.get("/count")
async def get_task_count(db: AsyncSession = Depends(get_db_session)):
    search_service = SearchService(db)
    count = await search_service.get_task_count()
    return {"count": count}


@router.delete("/{task_id}")
async def delete_task(task_id: str, db: AsyncSession = Depends(get_db_session)):
    search_service = SearchService(db)
    success = await search_service.delete_task(task_id)
    if success:
        return {"message": "Task deleted successfully"}
    return {"error": "Task not found"}, 404


@router.delete("/")
async def clear_all_tasks(db: AsyncSession = Depends(get_db_session)):
    search_service = SearchService(db)
    count = await search_service.clear_all_tasks()
    return {"message": f"Deleted {count} tasks"}
