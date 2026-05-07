from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.search import router as search_router
from app.api.tasks import router as tasks_router
from app.api.analytics import router as analytics_router
from app.config import settings

app = FastAPI(
    title=settings.APP_NAME,
    description="有奖问卷任务采集与对比工具 API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")


@app.get("/")
async def root():
    return {"message": "Welcome to Survey Hunter API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
