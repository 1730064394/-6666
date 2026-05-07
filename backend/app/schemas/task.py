from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class TaskBase(BaseModel):
    platform: str
    title: str
    description: Optional[str] = None
    reward: float = Field(gt=0)
    currency: str = "USD"
    estimated_time: Optional[int] = Field(default=None, ge=0)
    url: str
    requirements: Optional[List[str]] = []
    category: Optional[str] = None
    difficulty: Optional[str] = "medium"
    rating: Optional[float] = Field(default=3.0, ge=1, le=5)


class TaskCreate(TaskBase):
    task_id: str
    posted_at: Optional[datetime] = None


class TaskResponse(TaskBase):
    id: str
    task_id: str
    reward_usd: Optional[float] = None
    posted_at: Optional[datetime] = None
    scraped_at: datetime
    efficiency_score: float
    efficiency_label: str

    class Config:
        from_attributes = True


class TaskListResponse(BaseModel):
    total: int
    page: int
    limit: int
    tasks: List[TaskResponse]
