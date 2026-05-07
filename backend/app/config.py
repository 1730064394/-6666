from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "Survey Hunter"
    DATABASE_URL: str = "sqlite+aiosqlite:///./survey.db"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    SCRAPER_DELAY_MIN: int = 3
    SCRAPER_DELAY_MAX: int = 10

    class Config:
        env_file = ".env"


settings = Settings()
