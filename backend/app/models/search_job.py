from sqlalchemy import Column, String, DateTime, Integer, Text, JSON
from sqlalchemy.sql import func
import uuid
from app.database import Base
from enum import Enum


class JobStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class SearchJob(Base):
    __tablename__ = "search_jobs"

    id = Column(String, primary_key=True, default=lambda: f"job_{uuid.uuid4().hex[:12]}")
    keyword = Column(String, nullable=False, index=True)
    platforms = Column(JSON, default=list)
    filters = Column(JSON, default=dict)
    status = Column(String, default=JobStatus.PENDING.value)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    results_count = Column(Integer, default=0)
    error_message = Column(Text)

    def __repr__(self):
        return f"<SearchJob {self.id}: {self.keyword}>"
