from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON
from sqlalchemy.sql import func
import uuid
from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: f"task_{uuid.uuid4().hex[:12]}")
    platform = Column(String, nullable=False, index=True)
    task_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    reward = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    reward_usd = Column(Float)
    estimated_time = Column(Integer)
    url = Column(String, nullable=False)
    requirements = Column(JSON)
    posted_at = Column(DateTime(timezone=True))
    scraped_at = Column(DateTime(timezone=True), server_default=func.now())
    category = Column(String)
    difficulty = Column(String)
    rating = Column(Float)

    def __repr__(self):
        return f"<Task {self.platform}: {self.title[:30]}>"

    @property
    def efficiency_score(self) -> float:
        if not self.reward_usd or not self.estimated_time:
            return 0.0
        difficulty_factor = {"easy": 1.0, "medium": 1.5, "hard": 2.0}.get(self.difficulty, 1.5)
        rating = self.rating or 3.0
        return (self.reward_usd * rating) / (self.estimated_time * difficulty_factor)

    @property
    def efficiency_label(self) -> str:
        score = self.efficiency_score
        if score > 8:
            return "超值推荐"
        elif score > 5:
            return "性价比高"
        elif score > 2:
            return "正常"
        else:
            return "偏低"
