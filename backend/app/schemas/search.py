from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum


class JobStatusSchema(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class PlatformFilter(BaseModel):
    min_reward: Optional[float] = Field(default=None, ge=0)
    max_reward: Optional[float] = Field(default=None, ge=0)
    max_time: Optional[int] = Field(default=None, ge=0)
    difficulty: Optional[str] = None


class SearchCreate(BaseModel):
    keyword: str = Field(min_length=1, max_length=100)
    platforms: List[str] = ["all"]
    filters: Optional[PlatformFilter] = None


class SearchResponse(BaseModel):
    job_id: str
    status: JobStatusSchema
    message: str
    keyword: str
    started_at: datetime
    results_count: Optional[int] = None


class SearchJobResponse(BaseModel):
    id: str
    keyword: str
    platforms: List[str]
    status: JobStatusSchema
    started_at: datetime
    completed_at: Optional[datetime] = None
    results_count: int
    error_message: Optional[str] = None

    class Config:
        from_attributes = True
