# 有奖问卷任务采集与对比系统 - 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task.

**Goal:** 构建一个完整的 FastAPI + React 全栈系统，实现从多个众包平台采集有奖问卷任务数据，支持实时搜索、数据清洗、排序对比和可视化分析。

**Architecture:** FastAPI 后端提供 REST API，Playwright 爬虫模块采集数据，SQLite 存储；React 前端提供交互式搜索和数据可视化界面。系统支持关键词搜索、实时进度反馈和数据图表展示。

**Tech Stack:** FastAPI, Playwright, SQLAlchemy, React 18, TypeScript, Vite, Recharts

---

## 项目结构规划

```
survey-hunter/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI 应用入口
│   │   ├── config.py               # 配置管理
│   │   ├── database.py              # 数据库连接
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── task.py              # Task 模型
│   │   │   └── search_job.py        # SearchJob 模型
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── task.py               # Task Pydantic schemas
│   │   │   └── search.py             # Search schemas
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── deps.py                # 依赖注入
│   │   │   ├── search.py              # 搜索 API 路由
│   │   │   ├── tasks.py               # 任务 API 路由
│   │   │   └── analytics.py           # 分析 API 路由
│   │   ├── scrapers/
│   │   │   ├── __init__.py
│   │   │   ├── base.py                # 爬虫基类
│   │   │   ├── factory.py             # 爬虫工厂
│   │   │   ├── mturk.py               # MTurk 爬虫
│   │   │   ├── prolific.py            # Prolific 爬虫
│   │   │   ├── clickworker.py         # Clickworker 爬虫
│   │   │   └── picoworkers.py         # Picoworkers 爬虫
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── search_service.py       # 搜索服务
│   │       ├── analytics_service.py    # 分析服务
│   │       └── currency_service.py     # 货币转换服务
│   ├── requirements.txt
│   └── run.py                         # 启动脚本
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── api/
│   │   │   └── index.ts                # API 客户端
│   │   ├── components/
│   │   │   ├── SearchForm.tsx          # 搜索表单
│   │   │   ├── TaskList.tsx            # 任务列表
│   │   │   ├── TaskCard.tsx            # 任务卡片
│   │   │   ├── Dashboard.tsx           # 统计面板
│   │   │   ├── Charts.tsx              # 图表组件
│   │   │   └── LoadingSpinner.tsx      # 加载指示器
│   │   ├── hooks/
│   │   │   └── useSearch.ts            # 搜索 hook
│   │   └── types/
│   │       └── index.ts                # TypeScript 类型
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docs/
│   ├── survey-hunter-design.md
│   └── survey-hunter-plan.md
└── README.md
```

---

## 任务列表

### 任务 1: 后端项目初始化

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/run.py`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`

- [ ] **Step 1: 创建后端目录结构**

```bash
mkdir -p backend/app/{models,schemas,api,scrapers,services}
touch backend/app/__init__.py
touch backend/app/models/__init__.py
touch backend/app/schemas/__init__.py
touch backend/app/api/__init__.py
touch backend/app/scrapers/__init__.py
touch backend/app/services/__init__.py
```

- [ ] **Step 2: 创建 requirements.txt**

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
aiosqlite==0.19.0
pydantic==2.5.3
pydantic-settings==2.1.0
playwright==1.40.0
httpx==0.26.0
python-multipart==0.0.6
```

- [ ] **Step 3: 创建配置模块 app/config.py**

```python
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
```

- [ ] **Step 4: 创建数据库模块 app/database.py**

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

- [ ] **Step 5: 创建启动脚本 run.py**

```python
import uvicorn
from app.main import app
from app.database import init_db

@app.on_event("startup")
async def startup():
    await init_db()

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
```

---

### 任务 2: 数据模型定义

**Files:**
- Create: `backend/app/models/task.py`
- Create: `backend/app/models/search_job.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/database.py`

- [ ] **Step 1: 创建 Task 模型 app/models/task.py**

```python
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
            return "超值的得推荐"
        elif score > 5:
            return "性价比高"
        elif score > 2:
            return "正常"
        else:
            return "偏低"
```

- [ ] **Step 2: 创建 SearchJob 模型 app/models/search_job.py**

```python
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
```

- [ ] **Step 3: 更新 models/__init__.py**

```python
from app.models.task import Task
from app.models.search_job import SearchJob, JobStatus

__all__ = ["Task", "SearchJob", "JobStatus"]
```

- [ ] **Step 4: 验证数据库模型**

Run: `cd backend && python -c "from app.database import Base; from app.models import Task, SearchJob; print('Models OK')"`
Expected: `Models OK`

---

### 任务 3: Pydantic Schemas 定义

**Files:**
- Create: `backend/app/schemas/task.py`
- Create: `backend/app/schemas/search.py`
- Modify: `backend/app/schemas/__init__.py`

- [ ] **Step 1: 创建 Task schemas app/schemas/task.py**

```python
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
```

- [ ] **Step 2: 创建 Search schemas app/schemas/search.py**

```python
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
```

- [ ] **Step 3: 更新 schemas/__init__.py**

```python
from app.schemas.task import TaskCreate, TaskResponse, TaskListResponse
from app.schemas.search import SearchCreate, SearchResponse, SearchJobResponse, PlatformFilter

__all__ = [
    "TaskCreate", "TaskResponse", "TaskListResponse",
    "SearchCreate", "SearchResponse", "SearchJobResponse", "PlatformFilter"
]
```

---

### 任务 4: 爬虫基类和工厂

**Files:**
- Create: `backend/app/scrapers/base.py`
- Create: `backend/app/scrapers/factory.py`
- Create: `backend/app/scrapers/__init__.py`

- [ ] **Step 1: 创建爬虫基类 app/scrapers/base.py**

```python
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from playwright.async_api import async_playwright, Browser, Page
import asyncio
import random
from app.config import settings

class BaseScraper(ABC):
    name: str
    base_url: str
    
    def __init__(self):
        self.browser: Optional[Browser] = None
        self.delay_min = settings.SCRAPER_DELAY_MIN
        self.delay_max = settings.SCRAPER_DELAY_MAX
    
    async def _random_delay(self):
        delay = random.uniform(self.delay_min, self.delay_max)
        await asyncio.sleep(delay)
    
    async def _init_browser(self):
        if not self.browser:
            p = await async_playwright().start()
            self.browser = await p.chromium.launch(headless=True)
        return self.browser
    
    async def _close_browser(self):
        if self.browser:
            await self.browser.close()
            self.browser = None
    
    async def _create_page(self) -> Page:
        browser = await self._init_browser()
        page = await browser.new_page()
        await page.set_viewport_size({"width": 1920, "height": 1080})
        return page
    
    async def _fetch_page(self, url: str) -> Optional[str]:
        page = await self._create_page()
        try:
            await page.goto(url, wait_until="networkidle", timeout=30000)
            content = await page.content()
            return content
        except Exception as e:
            print(f"Error fetching {url}: {e}")
            return None
        finally:
            await page.close()
    
    @abstractmethod
    async def search(self, keyword: str) -> List[Dict]:
        pass
    
    @abstractmethod
    async def get_task_details(self, task_url: str) -> Optional[Dict]:
        pass
    
    async def scrape(self, keyword: str) -> List[Dict]:
        tasks = await self.search(keyword)
        results = []
        for task in tasks:
            details = await self.get_task_details(task.get("url", ""))
            if details:
                details["platform"] = self.name
                results.append(details)
            await self._random_delay()
        await self._close_browser()
        return results
```

- [ ] **Step 2: 创建爬虫工厂 app/scrapers/factory.py**

```python
from typing import Dict, Type
from app.scrapers.base import BaseScraper

class ScraperFactory:
    _scrapers: Dict[str, Type[BaseScraper]] = {}
    
    @classmethod
    def register(cls, name: str, scraper_class: Type[BaseScraper]):
        cls._scrapers[name] = scraper_class
    
    @classmethod
    def create(cls, name: str) -> BaseScraper:
        if name not in cls._scrapers:
            raise ValueError(f"Unknown scraper: {name}")
        return cls._scrapers[name]()
    
    @classmethod
    def available(cls) -> list:
        return list(cls._scrapers.keys())
    
    @classmethod
    def all_platforms(cls) -> list:
        return ["mturk", "prolific", "clickworker", "picoworkers", "reddit", "twitter"]

def register_scraper(name: str):
    def decorator(cls: Type[BaseScraper]):
        ScraperFactory.register(name, cls)
        return cls
    return decorator
```

- [ ] **Step 3: 创建 __init__.py**

```python
from app.scrapers.base import BaseScraper
from app.scrapers.factory import ScraperFactory, register_scraper

__all__ = ["BaseScraper", "ScraperFactory", "register_scraper"]
```

- [ ] **Step 4: 测试爬虫工厂**

Run: `cd backend && python -c "from app.scrapers.factory import ScraperFactory; print(ScraperFactory.all_platforms())"`
Expected: 显示所有可用平台

---

### 任务 5: 具体平台爬虫实现

**Files:**
- Create: `backend/app/scrapers/mturk.py`
- Create: `backend/app/scrapers/prolific.py`
- Create: `backend/app/scrapers/clickworker.py`
- Create: `backend/app/scrapers/picoworkers.py`

- [ ] **Step 1: 创建 MTurk 爬虫 app/scrapers/mturk.py**

```python
from typing import List, Dict, Optional
from app.scrapers.base import BaseScraper
from app.scrapers.factory import register_scraper
from playwright.async_api import Page
from bs4 import BeautifulSoup
from datetime import datetime

@register_scraper("mturk")
class MTurkScraper(BaseScraper):
    name = "Amazon MTurk"
    base_url = "https://worker.mturk.com"
    
    async def search(self, keyword: str) -> List[Dict]:
        page = await self._create_page()
        search_url = f"{self.base_url}/projects?filter={keyword}"
        
        try:
            await page.goto(search_url, wait_until="networkidle")
            await page.wait_for_selector(".task-row", timeout=10000)
            
            tasks = []
            task_elements = await page.query_selector_all(".task-row")
            
            for element in task_elements[:20]:
                task_data = await self._extract_task_preview(element)
                if task_data:
                    tasks.append(task_data)
            
            return tasks
        except Exception as e:
            print(f"MTurk search error: {e}")
            return []
        finally:
            await page.close()
    
    async def _extract_task_preview(self, element) -> Dict:
        try:
            title_elem = await element.query_selector("h2 a")
            reward_elem = await element.query_selector(".reward")
            time_elem = await element.query_selector(".duration")
            
            title = await title_elem.inner_text() if title_elem else ""
            reward_text = await reward_elem.inner_text() if reward_elem else "$0"
            time_text = await time_elem.inner_text() if time_elem else ""
            
            reward = float(reward_text.replace("$", "").strip())
            
            href = await title_elem.get_attribute("href") if title_elem else ""
            
            return {
                "title": title.strip(),
                "reward": reward,
                "estimated_time": self._parse_time(time_text),
                "url": f"{self.base_url}{href}" if href.startswith("/") else href
            }
        except:
            return {}
    
    def _parse_time(self, time_text: str) -> int:
        import re
        match = re.search(r"(\d+)", time_text)
        return int(match.group(1)) if match else 30
    
    async def get_task_details(self, task_url: str) -> Optional[Dict]:
        content = await self._fetch_page(task_url)
        if not content:
            return None
        
        soup = BeautifulSoup(content, "html.parser")
        
        title_elem = soup.select_one("h1")
        reward_elem = soup.select_one(".reward-value")
        desc_elem = soup.select_one(".description")
        
        title = title_elem.text.strip() if title_elem else ""
        reward_text = reward_elem.text if reward_elem else "$0"
        reward = float(reward_text.replace("$", "").strip())
        description = desc_elem.text.strip() if desc_elem else ""
        
        return {
            "task_id": task_url.split("/")[-1],
            "title": title,
            "description": description,
            "reward": reward,
            "currency": "USD",
            "estimated_time": 30,
            "url": task_url,
            "requirements": [],
            "posted_at": datetime.utcnow()
        }
```

- [ ] **Step 2: 创建 Prolific 爬虫 app/scrapers/prolific.py**

```python
from typing import List, Dict, Optional
from app.scrapers.base import BaseScraper
from app.scrapers.factory import register_scraper
from playwright.async_api import Page
from bs4 import BeautifulSoup
from datetime import datetime

@register_scraper("prolific")
class ProlificScraper(BaseScraper):
    name = "Prolific"
    base_url = "https://www.prolific.com"
    
    async def search(self, keyword: str) -> List[Dict]:
        page = await self._create_page()
        search_url = f"{self.base_url}/studies?search={keyword}"
        
        try:
            await page.goto(search_url, wait_until="networkidle")
            await page.wait_for_selector('[data-testid="study-card"]', timeout=10000)
            
            tasks = []
            cards = await page.query_selector_all('[data-testid="study-card"]')
            
            for card in cards[:20]:
                task_data = await self._extract_card(card)
                if task_data:
                    tasks.append(task_data)
            
            return tasks
        except Exception as e:
            print(f"Prolific search error: {e}")
            return []
        finally:
            await page.close()
    
    async def _extract_card(self, card) -> Dict:
        try:
            title_elem = await card.query_selector('[data-testid="study-title"]')
            reward_elem = await card.query_selector('[data-testid="study-reward"]')
            time_elem = await card.query_selector('[data-testid="study-time"]')
            
            title = await title_elem.inner_text() if title_elem else ""
            reward_text = await reward_elem.inner_text() if reward_elem else "£0"
            time_text = await time_elem.inner_text() if time_elem else ""
            
            reward = float(reward_text.replace("£", "").replace("$", "").strip())
            time_minutes = self._parse_prolific_time(time_text)
            
            href = await card.get_attribute("href") if card else ""
            
            return {
                "title": title.strip(),
                "reward": reward,
                "currency": "GBP" if "£" in reward_text else "USD",
                "estimated_time": time_minutes,
                "url": f"{self.base_url}{href}" if href else ""
            }
        except:
            return {}
    
    def _parse_prolific_time(self, time_text: str) -> int:
        import re
        match = re.search(r"(\d+)\s*min", time_text.lower())
        return int(match.group(1)) if match else 20
    
    async def get_task_details(self, task_url: str) -> Optional[Dict]:
        content = await self._fetch_page(task_url)
        if not content:
            return None
        
        soup = BeautifulSoup(content, "html.parser")
        
        title_elem = soup.select_one('[data-testid="study-title"]')
        reward_elem = soup.select_one('[data-testid="study-reward"]')
        desc_elem = soup.select_one('[data-testid="study-description"]')
        
        title = title_elem.text.strip() if title_elem else ""
        reward_text = reward_elem.text if reward_elem else "£0"
        reward = float(reward_text.replace("£", "").replace("$", "").strip())
        description = desc_elem.text.strip() if desc_elem else ""
        
        return {
            "task_id": task_url.split("/")[-1],
            "title": title,
            "description": description,
            "reward": reward,
            "currency": "GBP" if "£" in reward_text else "USD",
            "estimated_time": 20,
            "url": task_url,
            "requirements": [],
            "posted_at": datetime.utcnow(),
            "rating": 4.5
        }
```

- [ ] **Step 3: 创建 Clickworker 爬虫 app/scrapers/clickworker.py**

```python
from typing import List, Dict, Optional
from app.scrapers.base import BaseScraper
from app.scrapers.factory import register_scraper
from playwright.async_api import Page
from bs4 import BeautifulSoup
from datetime import datetime

@register_scraper("clickworker")
class ClickworkerScraper(BaseScraper):
    name = "Clickworker"
    base_url = "https://www.clickworker.com"
    
    async def search(self, keyword: str) -> List[Dict]:
        page = await self._create_page()
        search_url = f"{self.base_url}/en/jobs?query={keyword}"
        
        try:
            await page.goto(search_url, wait_until="networkidle")
            await page.wait_for_selector(".job-list-item", timeout=10000)
            
            tasks = []
            items = await page.query_selector_all(".job-list-item")
            
            for item in items[:20]:
                task_data = await self._extract_item(item)
                if task_data:
                    tasks.append(task_data)
            
            return tasks
        except Exception as e:
            print(f"Clickworker search error: {e}")
            return []
        finally:
            await page.close()
    
    async def _extract_item(self, item) -> Dict:
        try:
            title_elem = await item.query_selector(".job-title")
            reward_elem = await item.query_selector(".job-reward")
            time_elem = await item.query_selector(".job-time")
            
            title = await title_elem.inner_text() if title_elem else ""
            reward_text = await reward_elem.inner_text() if reward_elem else "€0"
            time_text = await time_elem.inner_text() if time_elem else ""
            
            reward = float(reward_text.replace("€", "").replace("$", "").strip())
            
            href = await item.get_attribute("href") if item else ""
            
            return {
                "title": title.strip(),
                "reward": reward,
                "currency": "EUR" if "€" in reward_text else "USD",
                "estimated_time": self._parse_time(time_text),
                "url": f"{self.base_url}{href}" if href.startswith("/") else href
            }
        except:
            return {}
    
    def _parse_time(self, time_text: str) -> int:
        import re
        match = re.search(r"(\d+)", time_text)
        return int(match.group(1)) if match else 15
    
    async def get_task_details(self, task_url: str) -> Optional[Dict]:
        content = await self._fetch_page(task_url)
        if not content:
            return None
        
        soup = BeautifulSoup(content, "html.parser")
        
        title_elem = soup.select_one("h1")
        reward_elem = soup.select_one(".reward-value")
        desc_elem = soup.select_one(".job-description")
        
        title = title_elem.text.strip() if title_elem else ""
        reward_text = reward_elem.text if reward_elem else "€0"
        reward = float(reward_text.replace("€", "").replace("$", "").strip())
        description = desc_elem.text.strip() if desc_elem else ""
        
        return {
            "task_id": task_url.split("/")[-1],
            "title": title,
            "description": description,
            "reward": reward,
            "currency": "EUR" if "€" in reward_text else "USD",
            "estimated_time": 15,
            "url": task_url,
            "requirements": [],
            "posted_at": datetime.utcnow(),
            "rating": 3.8
        }
```

- [ ] **Step 4: 创建 Picoworkers 爬虫 app/scrapers/picoworkers.py**

```python
from typing import List, Dict, Optional
from app.scrapers.base import BaseScraper
from app.scrapers.factory import register_scraper
from playwright.async_api import Page
from bs4 import BeautifulSoup
from datetime import datetime

@register_scraper("picoworkers")
class PicoworkersScraper(BaseScraper):
    name = "Picoworkers"
    base_url = "https://picoworkers.com"
    
    async def search(self, keyword: str) -> List[Dict]:
        page = await self._create_page()
        search_url = f"{self.base_url}/jobs?search={keyword}"
        
        try:
            await page.goto(search_url, wait_until="networkidle")
            await page.wait_for_selector(".job-card", timeout=10000)
            
            tasks = []
            cards = await page.query_selector_all(".job-card")
            
            for card in cards[:20]:
                task_data = await self._extract_card(card)
                if task_data:
                    tasks.append(task_data)
            
            return tasks
        except Exception as e:
            print(f"Picoworkers search error: {e}")
            return []
        finally:
            await page.close()
    
    async def _extract_card(self, card) -> Dict:
        try:
            title_elem = await card.query_selector(".job-title")
            reward_elem = await card.query_selector(".job-price")
            time_elem = await card.query_selector(".job-time")
            
            title = await title_elem.inner_text() if title_elem else ""
            reward_text = await reward_elem.inner_text() if reward_elem else "$0"
            time_text = await time_elem.inner_text() if time_elem else ""
            
            reward = float(reward_text.replace("$", "").strip())
            
            href = await card.get_attribute("href") if card else ""
            
            return {
                "title": title.strip(),
                "reward": reward,
                "currency": "USD",
                "estimated_time": self._parse_time(time_text),
                "url": f"{self.base_url}{href}" if href.startswith("/") else href
            }
        except:
            return {}
    
    def _parse_time(self, time_text: str) -> int:
        import re
        match = re.search(r"(\d+)", time_text)
        return int(match.group(1)) if match else 10
    
    async def get_task_details(self, task_url: str) -> Optional[Dict]:
        content = await self._fetch_page(task_url)
        if not content:
            return None
        
        soup = BeautifulSoup(content, "html.parser")
        
        title_elem = soup.select_one("h1")
        reward_elem = soup.select_one(".price-value")
        desc_elem = soup.select_one(".job-detail")
        
        title = title_elem.text.strip() if title_elem else ""
        reward_text = reward_elem.text if reward_elem else "$0"
        reward = float(reward_text.replace("$", "").strip())
        description = desc_elem.text.strip() if desc_elem else ""
        
        return {
            "task_id": task_url.split("/")[-1],
            "title": title,
            "description": description,
            "reward": reward,
            "currency": "USD",
            "estimated_time": 10,
            "url": task_url,
            "requirements": [],
            "posted_at": datetime.utcnow(),
            "rating": 3.5
        }
```

- [ ] **Step 5: 验证爬虫导入**

Run: `cd backend && python -c "from app.scrapers.mturk import MTurkScraper; from app.scrapers.prolific import ProlificScraper; print('All scrapers imported OK')"`
Expected: `All scrapers imported OK`

---

### 任务 6: 服务层实现

**Files:**
- Create: `backend/app/services/currency_service.py`
- Create: `backend/app/services/search_service.py`
- Create: `backend/app/services/analytics_service.py`

- [ ] **Step 1: 创建货币服务 app/services/currency_service.py**

```python
from typing import Dict

class CurrencyService:
    RATES: Dict[str, float] = {
        "USD": 1.0,
        "EUR": 1.08,
        "GBP": 1.26,
        "CAD": 0.74,
        "AUD": 0.65
    }
    
    @classmethod
    def to_usd(cls, amount: float, currency: str) -> float:
        if currency.upper() not in cls.RATES:
            currency = "USD"
        return round(amount * cls.RATES[currency.upper()], 2)
    
    @classmethod
    def format_currency(cls, amount: float, currency: str = "USD") -> str:
        symbols = {"USD": "$", "EUR": "€", "GBP": "£", "CAD": "C$", "AUD": "A$"}
        symbol = symbols.get(currency.upper(), "$")
        return f"{symbol}{amount:.2f}"
```

- [ ] **Step 2: 创建搜索服务 app/services/search_service.py**

```python
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from app.models import Task, SearchJob, JobStatus
from app.schemas import TaskCreate, SearchCreate
from app.scrapers.factory import ScraperFactory
from app.services.currency_service import CurrencyService
from app import scrapers

class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_search_job(self, search_data: SearchCreate) -> SearchJob:
        job = SearchJob(
            keyword=search_data.keyword,
            platforms=search_data.platforms,
            filters=search_data.filters.model_dump() if search_data.filters else {},
            status=JobStatus.PENDING.value
        )
        self.db.add(job)
        await self.db.commit()
        await self.db.refresh(job)
        return job
    
    async def update_job_status(self, job_id: str, status: JobStatus, error: Optional[str] = None):
        result = await self.db.execute(select(SearchJob).where(SearchJob.id == job_id))
        job = result.scalar_one_or_none()
        if job:
            job.status = status.value
            if error:
                job.error_message = error
            if status in [JobStatus.COMPLETED, JobStatus.FAILED]:
                job.completed_at = datetime.utcnow()
            await self.db.commit()
    
    async def run_search(self, job_id: str):
        await self.update_job_status(job_id, JobStatus.RUNNING)
        
        try:
            result = await self.db.execute(select(SearchJob).where(SearchJob.id == job_id))
            job = result.scalar_one_or_none()
            
            if not job:
                return
            
            all_tasks = []
            platforms = job.platforms if job.platforms and job.platforms != ["all"] else ScraperFactory.all_platforms()
            
            for platform in platforms:
                try:
                    scraper = ScraperFactory.create(platform)
                    tasks = await scraper.scrape(job.keyword)
                    all_tasks.extend(tasks)
                except Exception as e:
                    print(f"Error scraping {platform}: {e}")
            
            saved_count = await self._save_tasks(all_tasks)
            
            result = await self.db.execute(select(SearchJob).where(SearchJob.id == job_id))
            job = result.scalar_one_or_none()
            job.results_count = saved_count
            await self.db.commit()
            
            await self.update_job_status(job_id, JobStatus.COMPLETED)
            
        except Exception as e:
            await self.update_job_status(job_id, JobStatus.FAILED, str(e))
    
    async def _save_tasks(self, tasks: List[dict]) -> int:
        saved = 0
        for task_data in tasks:
            task_data["reward_usd"] = CurrencyService.to_usd(
                task_data.get("reward", 0),
                task_data.get("currency", "USD")
            )
            
            existing = await self.db.execute(
                select(Task).where(
                    Task.platform == task_data.get("platform"),
                    Task.task_id == task_data.get("task_id", task_data.get("url", ""))
                )
            )
            if existing.scalar_one_or_none():
                continue
            
            task = Task(**task_data)
            self.db.add(task)
            saved += 1
        
        await self.db.commit()
        return saved
    
    async def get_tasks(
        self,
        keyword: Optional[str] = None,
        platform: Optional[str] = None,
        sort_by: str = "reward_usd",
        order: str = "asc",
        page: int = 1,
        limit: int = 20
    ):
        query = select(Task)
        
        if keyword:
            query = query.where(Task.title.contains(keyword))
        if platform and platform != "all":
            query = query.where(Task.platform == platform)
        
        if sort_by == "efficiency":
            sort_column = Task.reward_usd
        else:
            sort_column = getattr(Task, sort_by, Task.reward_usd)
        
        if order == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())
        
        total_result = await self.db.execute(select(Task.count()))
        total = total_result.scalar()
        
        query = query.offset((page - 1) * limit).limit(limit)
        result = await self.db.execute(query)
        tasks = result.scalars().all()
        
        return {
            "total": total,
            "page": page,
            "limit": limit,
            "tasks": tasks
        }
```

- [ ] **Step 3: 创建分析服务 app/services/analytics_service.py**

```python
from typing import Dict, List
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import Task, SearchJob

class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_summary(self) -> Dict:
        total_result = await self.db.execute(select(func.count(Task.id)))
        total_tasks = total_result.scalar() or 0
        
        avg_result = await self.db.execute(select(func.avg(Task.reward_usd)))
        avg_reward = avg_result.scalar() or 0
        
        max_result = await self.db.execute(select(func.max(Task.reward_usd)))
        max_reward = max_result.scalar() or 0
        
        platform_result = await self.db.execute(
            select(Task.platform, func.count(Task.id)).group_by(Task.platform)
        )
        platforms = [{"name": p, "count": c} for p, c in platform_result.all()]
        
        return {
            "total_tasks": total_tasks,
            "avg_reward": round(avg_reward, 2),
            "max_reward": round(max_reward, 2),
            "platforms": platforms,
            "platform_count": len(platforms)
        }
    
    async def get_reward_distribution(self) -> List[Dict]:
        ranges = [
            ("0-2", 0, 2),
            ("2-5", 2, 5),
            ("5-10", 5, 10),
            ("10+", 10, 9999)
        ]
        
        distribution = []
        for label, min_val, max_val in ranges:
            result = await self.db.execute(
                select(func.count(Task.id)).where(
                    Task.reward_usd >= min_val,
                    Task.reward_usd < max_val
                )
            )
            count = result.scalar() or 0
            distribution.append({"range": label, "count": count})
        
        return distribution
    
    async def get_platform_comparison(self) -> List[Dict]:
        result = await self.db.execute(
            select(
                Task.platform,
                func.avg(Task.reward_usd),
                func.count(Task.id)
            ).group_by(Task.platform)
        )
        
        return [
            {
                "platform": platform,
                "avg_reward": round(avg_reward, 2),
                "task_count": count
            }
            for platform, avg_reward, count in result.all()
        ]
    
    async def get_efficiency_distribution(self) -> List[Dict]:
        ranges = [
            ("超值的得推荐 (>8)", 8, 9999),
            ("性价比高 (5-8)", 5, 8),
            ("正常 (2-5)", 2, 5),
            ("偏低 (<2)", 0, 2)
        ]
        
        distribution = []
        for label, min_val, max_val in ranges:
            result = await self.db.execute(
                select(func.count(Task.id)).where(
                    Task.reward_usd != None
                )
            )
            total = result.scalar() or 1
            
            count_result = await self.db.execute(
                select(func.count(Task.id)).where(
                    Task.reward_usd >= min_val,
                    Task.reward_usd < max_val
                )
            )
            count = count_result.scalar() or 0
            
            distribution.append({
                "label": label,
                "count": count,
                "percentage": round(count / total * 100, 1) if total > 0 else 0
            })
        
        return distribution
```

---

### 任务 7: API 路由实现

**Files:**
- Create: `backend/app/api/deps.py`
- Create: `backend/app/api/search.py`
- Create: `backend/app/api/tasks.py`
- Create: `backend/app/api/analytics.py`
- Create: `backend/app/main.py`

- [ ] **Step 1: 创建依赖注入 app/api/deps.py**

```python
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session_maker

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
```

- [ ] **Step 2: 创建搜索 API app/api/search.py**

```python
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.schemas import SearchCreate, SearchResponse, SearchJobResponse
from app.services import SearchService
from app.models import SearchJob
from sqlalchemy import select

router = APIRouter(prefix="/api/search", tags=["Search"])

@router.post("", response_model=SearchResponse)
async def create_search(
    search_data: SearchCreate,
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    service = SearchService(db)
    job = await service.create_search_job(search_data)
    
    background_tasks.add_task(service.run_search, job.id)
    
    return SearchResponse(
        job_id=job.id,
        status=job.status,
        message="搜索任务已启动",
        keyword=job.keyword,
        started_at=job.started_at,
        results_count=0
    )

@router.get("/{job_id}", response_model=SearchJobResponse)
async def get_search_status(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SearchJob).where(SearchJob.id == job_id))
    job = result.scalar_one_or_none()
    
    if not job:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="搜索任务不存在")
    
    return job

@router.get("", response_model=list[SearchJobResponse])
async def list_searches(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SearchJob).order_by(SearchJob.started_at.desc()).limit(20))
    return result.scalars().all()
```

- [ ] **Step 3: 创建任务 API app/api/tasks.py**

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.schemas import TaskListResponse
from app.services import SearchService

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

@router.get("", response_model=TaskListResponse)
async def get_tasks(
    keyword: str = Query(None),
    platform: str = Query("all"),
    sort_by: str = Query("reward_usd"),
    order: str = Query("asc"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    service = SearchService(db)
    result = await service.get_tasks(
        keyword=keyword,
        platform=platform,
        sort_by=sort_by,
        order=order,
        page=page,
        limit=limit
    )
    
    tasks_with_efficiency = []
    for task in result["tasks"]:
        task_dict = {
            "id": task.id,
            "platform": task.platform,
            "task_id": task.task_id,
            "title": task.title,
            "description": task.description,
            "reward": task.reward,
            "currency": task.currency,
            "reward_usd": task.reward_usd,
            "estimated_time": task.estimated_time,
            "url": task.url,
            "requirements": task.requirements or [],
            "posted_at": task.posted_at,
            "scraped_at": task.scraped_at,
            "category": task.category,
            "difficulty": task.difficulty,
            "rating": task.rating,
            "efficiency_score": task.efficiency_score,
            "efficiency_label": task.efficiency_label
        }
        tasks_with_efficiency.append(task_dict)
    
    return {
        "total": result["total"],
        "page": result["page"],
        "limit": result["limit"],
        "tasks": tasks_with_efficiency
    }
```

- [ ] **Step 4: 创建分析 API app/api/analytics.py**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db
from app.services import AnalyticsService

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/summary")
async def get_summary(db: AsyncSession = Depends(get_db)):
    service = AnalyticsService(db)
    return await service.get_summary()

@router.get("/chart/reward-distribution")
async def get_reward_distribution(db: AsyncSession = Depends(get_db)):
    service = AnalyticsService(db)
    return await service.get_reward_distribution()

@router.get("/chart/platform-comparison")
async def get_platform_comparison(db: AsyncSession = Depends(get_db)):
    service = AnalyticsService(db)
    return await service.get_platform_comparison()

@router.get("/chart/efficiency-distribution")
async def get_efficiency_distribution(db: AsyncSession = Depends(get_db)):
    service = AnalyticsService(db)
    return await service.get_efficiency_distribution()
```

- [ ] **Step 5: 创建主应用 app/main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api import search, tasks, analytics

app = FastAPI(title=settings.APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search.router)
app.include_router(tasks.router)
app.include_router(analytics.router)

@app.on_event("startup")
async def startup():
    await init_db()

@app.get("/")
async def root():
    return {"message": "Survey Hunter API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 6: 测试后端 API**

Run: `cd backend && python -c "from app.main import app; print('FastAPI app created successfully')"`
Expected: `FastAPI app created successfully`

---

### 任务 8: 前端项目初始化

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/index.css`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "survey-hunter-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.3",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}
```

- [ ] **Step 2: 创建 TypeScript 配置**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: 创建 Vite 配置**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

- [ ] **Step 4: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Survey Hunter - 有奖问卷采集工具</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建类型定义 src/types/index.ts**

```typescript
export interface Task {
  id: string;
  platform: string;
  task_id: string;
  title: string;
  description?: string;
  reward: number;
  currency: string;
  reward_usd: number;
  estimated_time?: number;
  url: string;
  requirements: string[];
  posted_at?: string;
  scraped_at: string;
  category?: string;
  difficulty?: string;
  rating?: number;
  efficiency_score: number;
  efficiency_label: string;
}

export interface TaskListResponse {
  total: number;
  page: number;
  limit: number;
  tasks: Task[];
}

export interface SearchJob {
  id: string;
  keyword: string;
  platforms: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  results_count: number;
  error_message?: string;
}

export interface SearchResponse {
  job_id: string;
  status: string;
  message: string;
  keyword: string;
  started_at: string;
  results_count: number;
}

export interface AnalyticsSummary {
  total_tasks: number;
  avg_reward: number;
  max_reward: number;
  platforms: { name: string; count: number }[];
  platform_count: number;
}

export interface PlatformComparison {
  platform: string;
  avg_reward: number;
  task_count: number;
}

export interface RewardDistribution {
  range: string;
  count: number;
}

export interface EfficiencyDistribution {
  label: string;
  count: number;
  percentage: number;
}
```

- [ ] **Step 6: 创建 API 客户端 src/api/index.ts**

```typescript
import axios from 'axios';
import type {
  TaskListResponse,
  SearchResponse,
  SearchJob,
  AnalyticsSummary,
  PlatformComparison,
  RewardDistribution,
  EfficiencyDistribution
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000
});

export const searchApi = {
  create: (keyword: string, platforms: string[] = ['all']) =>
    api.post<SearchResponse>('/search', { keyword, platforms }),
  
  getStatus: (jobId: string) =>
    api.get<SearchJob>(`/search/${jobId}`),
  
  list: () =>
    api.get<SearchJob[]>('/search')
};

export const tasksApi = {
  list: (params: {
    keyword?: string;
    platform?: string;
    sort_by?: string;
    order?: string;
    page?: number;
    limit?: number;
  }) => api.get<TaskListResponse>('/tasks', { params })
};

export const analyticsApi = {
  getSummary: () => api.get<AnalyticsSummary>('/analytics/summary'),
  getPlatformComparison: () => api.get<PlatformComparison[]>('/analytics/chart/platform-comparison'),
  getRewardDistribution: () => api.get<RewardDistribution[]>('/analytics/chart/reward-distribution'),
  getEfficiencyDistribution: () => api.get<EfficiencyDistribution[]>('/analytics/chart/efficiency-distribution')
};
```

- [ ] **Step 7: 创建样式 src/index.css**

```css
:root {
  --primary: #3b82f6;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--gray-50);
  color: var(--gray-800);
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.header {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
}

.main {
  padding: 2rem 0;
}

.card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-primary:disabled {
  background: var(--gray-300);
  cursor: not-allowed;
}

.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.375rem;
  font-size: 1rem;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-label {
  color: var(--gray-500);
  font-size: 0.875rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--gray-800);
}

.task-list {
  display: grid;
  gap: 1rem;
}

.task-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.task-info {
  flex: 1;
}

.task-title {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--gray-800);
}

.task-meta {
  display: flex;
  gap: 1rem;
  color: var(--gray-500);
  font-size: 0.875rem;
}

.task-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-success {
  background: #d1fae5;
  color: #065f46;
}

.badge-primary {
  background: #dbeafe;
  color: #1e40af;
}

.badge-warning {
  background: #fef3c7;
  color: #92400e;
}

.badge-gray {
  background: var(--gray-100);
  color: var(--gray-600);
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3rem;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  
  .task-card {
    flex-direction: column;
  }
  
  .task-actions {
    flex-direction: row;
    width: 100%;
  }
}
```

- [ ] **Step 8: 创建入口文件 src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

---

### 任务 9: React 组件实现

**Files:**
- Create: `frontend/src/components/SearchForm.tsx`
- Create: `frontend/src/components/TaskCard.tsx`
- Create: `frontend/src/components/TaskList.tsx`
- Create: `frontend/src/components/Dashboard.tsx`
- Create: `frontend/src/components/Charts.tsx`
- Create: `frontend/src/App.tsx`

- [ ] **Step 1: 创建搜索表单组件 src/components/SearchForm.tsx**

```typescript
import { useState } from 'react';
import type { SearchResponse } from '../types';

interface Props {
  onSearch: (keyword: string, platforms: string[]) => Promise<SearchResponse | null>;
  isLoading: boolean;
}

const PLATFORMS = [
  { value: 'all', label: '所有平台' },
  { value: 'mturk', label: 'Amazon MTurk' },
  { value: 'prolific', label: 'Prolific' },
  { value: 'clickworker', label: 'Clickworker' },
  { value: 'picoworkers', label: 'Picoworkers' }
];

export function SearchForm({ onSearch, isLoading }: Props) {
  const [keyword, setKeyword] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['all']);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    
    const platforms = selectedPlatforms.includes('all') ? ['all'] : selectedPlatforms;
    await onSearch(keyword, platforms);
  };

  const togglePlatform = (value: string) => {
    if (value === 'all') {
      setSelectedPlatforms(['all']);
    } else {
      const newPlatforms = selectedPlatforms.filter(p => p !== 'all' && p !== value);
      if (!selectedPlatforms.includes(value)) {
        newPlatforms.push(value);
      }
      setSelectedPlatforms(newPlatforms.length ? newPlatforms : ['all']);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
            搜索关键词
          </label>
          <input
            type="text"
            className="input"
            placeholder="输入搜索关键词，如 survey, questionnaire..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div>
          <button type="submit" className="btn btn-primary" disabled={isLoading || !keyword.trim()}>
            {isLoading ? (
              <>
                <span className="spinner" style={{ width: '1rem', height: '1rem' }} />
                采集中...
              </>
            ) : (
              '🔍 开始采集'
            )}
          </button>
        </div>
      </div>
      
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {PLATFORMS.map(platform => (
          <label
            key={platform.value}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              background: selectedPlatforms.includes(platform.value) ? '#dbeafe' : '#f3f4f6',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <input
              type="checkbox"
              checked={selectedPlatforms.includes(platform.value)}
              onChange={() => togglePlatform(platform.value)}
              disabled={isLoading}
              style={{ display: 'none' }}
            />
            {platform.label}
          </label>
        ))}
      </div>
    </form>
  );
}
```

- [ ] **Step 2: 创建任务卡片组件 src/components/TaskCard.tsx**

```typescript
import type { Task } from '../types';

interface Props {
  task: Task;
}

const EFFICIENCY_COLORS: Record<string, { bg: string; text: string }> = {
  '超值的得推荐': { bg: '#d1fae5', text: '#065f46' },
  '性价比高': { bg: '#dbeafe', text: '#1e40af' },
  '正常': { bg: '#f3f4f6', text: '#4b5563' },
  '偏低': { bg: '#fef3c7', text: '#92400e' }
};

export function TaskCard({ task }: Props) {
  const efficiencyStyle = EFFICIENCY_COLORS[task.efficiency_label] || EFFICIENCY_COLORS['正常'];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(task.url);
    alert('链接已复制!');
  };

  return (
    <div className="task-card">
      <div className="task-info">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span>📌 {task.platform}</span>
          {task.estimated_time && <span>⏱️ {task.estimated_time}分钟</span>}
          {task.rating && <span>⭐ {task.rating.toFixed(1)}</span>}
          {task.difficulty && <span>📊 {task.difficulty}</span>}
        </div>
        {task.description && (
          <p style={{ marginTop: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
            {task.description.substring(0, 150)}...
          </p>
        )}
      </div>
      
      <div className="task-actions">
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>
            ${task.reward.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            ≈ ${task.reward_usd?.toFixed(2) || task.reward.toFixed(2)} USD
          </div>
        </div>
        
        <span 
          className="badge"
          style={{ background: efficiencyStyle.bg, color: efficiencyStyle.text }}
        >
          {task.efficiency_label}
        </span>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.5rem', fontSize: '0.75rem' }}
            onClick={handleCopyLink}
          >
            复制链接
          </button>
          <a 
            href={task.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ padding: '0.5rem', fontSize: '0.75rem', textDecoration: 'none' }}
          >
            打开
          </a>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: 创建任务列表组件 src/components/TaskList.tsx**

```typescript
import { TaskCard } from './TaskCard';
import type { Task } from '../types';

interface Props {
  tasks: Task[];
  isLoading: boolean;
}

export function TaskList({ tasks, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
        <p style={{ fontSize: '1.125rem' }}>暂无任务数据</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          请先搜索关键词采集任务
        </p>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 创建统计面板组件 src/components/Dashboard.tsx**

```typescript
import { useState, useEffect } from 'react';
import { analyticsApi } from '../api';
import type { AnalyticsSummary } from '../types';

export function Dashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const { data } = await analyticsApi.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="stat-card">
            <div className="stat-label">加载中...</div>
          </div>
        ))}
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-label">总任务数</div>
        <div className="stat-value">{summary.total_tasks}</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">平均报酬</div>
        <div className="stat-value" style={{ color: '#10b981' }}>
          ${summary.avg_reward.toFixed(2)}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">最高报酬</div>
        <div className="stat-value" style={{ color: '#f59e0b' }}>
          ${summary.max_reward.toFixed(2)}
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">采集平台</div>
        <div className="stat-value">{summary.platform_count}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 创建图表组件 src/components/Charts.tsx**

```typescript
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { analyticsApi } from '../api';
import type { PlatformComparison, RewardDistribution, EfficiencyDistribution } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function Charts() {
  const [platformData, setPlatformData] = useState<PlatformComparison[]>([]);
  const [rewardData, setRewardData] = useState<RewardDistribution[]>([]);
  const [efficiencyData, setEfficiencyData] = useState<EfficiencyDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [platformRes, rewardRes, efficiencyRes] = await Promise.all([
        analyticsApi.getPlatformComparison(),
        analyticsApi.getRewardDistribution(),
        analyticsApi.getEfficiencyDistribution()
      ]);
      setPlatformData(platformRes.data);
      setRewardData(rewardRes.data);
      setEfficiencyData(efficiencyRes.data);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="loading"><div className="spinner" /></div>;
  }

  return (
    <div className="charts-grid">
      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>📊 平台对比</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={platformData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="platform" />
            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
            <Tooltip />
            <Bar yAxisId="left" dataKey="task_count" fill="#3b82f6" name="任务数" />
            <Bar yAxisId="right" dataKey="avg_reward" fill="#10b981" name="平均报酬($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>💰 报酬分布</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={rewardData}
              dataKey="count"
              nameKey="range"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ range, count }) => `${range}: ${count}`}
            >
              {rewardData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>⭐ 性价比分布</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={efficiencyData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="label" width={120} />
            <Tooltip />
            <Bar dataKey="count" fill="#8b5cf6" name="任务数" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>📈 各平台平均报酬趋势</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={platformData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="platform" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="avg_reward" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: 创建主应用组件 src/App.tsx**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { SearchForm } from './components/SearchForm';
import { TaskList } from './components/TaskList';
import { Dashboard } from './components/Dashboard';
import { Charts } from './components/Charts';
import { tasksApi, searchApi } from './api';
import type { Task, SearchResponse, SearchJob } from './types';

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentJob, setCurrentJob] = useState<SearchJob | null>(null);
  const [showCharts, setShowCharts] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadTasks = useCallback(async () => {
    try {
      const { data } = await tasksApi.list({ limit: 50, sort_by: 'reward_usd', order: 'asc' });
      setTasks(data.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks, refreshKey]);

  const handleSearch = async (keyword: string, platforms: string[]): Promise<SearchResponse | null> => {
    setIsLoading(true);
    setCurrentJob(null);
    
    try {
      const { data } = await searchApi.create(keyword, platforms);
      
      const pollJob = async () => {
        const { data: job } = await searchApi.getStatus(data.job_id);
        setCurrentJob(job);
        
        if (job.status === 'completed') {
          setRefreshKey(k => k + 1);
          setIsLoading(false);
          return;
        } else if (job.status === 'failed') {
          setIsLoading(false);
          alert(`采集失败: ${job.error_message}`);
          return;
        }
        
        setTimeout(pollJob, 2000);
      };
      
      setTimeout(pollJob, 1000);
      return data;
    } catch (error) {
      console.error('Search failed:', error);
      setIsLoading(false);
      return null;
    }
  };

  return (
    <div>
      <header className="header">
        <div className="container header-content">
          <h1 className="logo">🎯 Survey Hunter</h1>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCharts(!showCharts)}
          >
            {showCharts ? '🔍 查看任务' : '📊 查看图表'}
          </button>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <Dashboard />
          
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
          
          {currentJob && (
            <div className="card" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              background: currentJob.status === 'running' ? '#dbeafe' : 
                         currentJob.status === 'completed' ? '#d1fae5' : '#fef3c7'
            }}>
              {currentJob.status === 'running' && <div className="spinner" />}
              <div>
                <strong>搜索状态:</strong> {currentJob.keyword}
                <span style={{ marginLeft: '1rem' }}>
                  {currentJob.status === 'pending' && '⏳ 等待中'}
                  {currentJob.status === 'running' && '🔄 采集中...'}
                  {currentJob.status === 'completed' && `✅ 完成 (${currentJob.results_count} 个任务)`}
                  {currentJob.status === 'failed' && `❌ 失败`}
                </span>
              </div>
            </div>
          )}

          {showCharts ? <Charts /> : <TaskList tasks={tasks} isLoading={isLoading && !currentJob} />}
        </div>
      </main>
    </div>
  );
}

export default App;
```

- [ ] **Step 7: 安装前端依赖并测试**

Run: `cd frontend && npm install`
Expected: 依赖安装成功

---

### 任务 10: 集成测试和示例数据

**Files:**
- Create: `backend/sample_data.py`
- Create: `scripts/generate_samples.py`

- [ ] **Step 1: 创建示例数据生成脚本**

```python
import asyncio
import sys
sys.path.insert(0, 'backend')

from app.database import init_db, async_session_maker
from app.models import Task
from app.services.currency_service import CurrencyService
from datetime import datetime, timedelta
import random

SAMPLE_TASKS = [
    {"platform": "Amazon MTurk", "title": "15-minute Consumer Survey about Shopping Habits", "reward": 2.50, "currency": "USD", "estimated_time": 15, "difficulty": "easy", "rating": 4.2},
    {"platform": "Amazon MTurk", "title": "30-minute Academic Research Survey", "reward": 5.00, "currency": "USD", "estimated_time": 30, "difficulty": "medium", "rating": 4.5},
    {"platform": "Amazon MTurk", "title": "Product Feedback Survey - Electronics", "reward": 3.75, "currency": "USD", "estimated_time": 20, "difficulty": "easy", "rating": 4.0},
    {"platform": "Prolific", "title": "Psychology Research Study - 25 minutes", "reward": 6.50, "currency": "GBP", "estimated_time": 25, "difficulty": "medium", "rating": 4.8},
    {"platform": "Prolific", "title": "Health & Wellness Survey", "reward": 8.00, "currency": "GBP", "estimated_time": 35, "difficulty": "medium", "rating": 4.7},
    {"platform": "Prolific", "title": "Political Opinion Poll", "reward": 4.50, "currency": "GBP", "estimated_time": 15, "difficulty": "easy", "rating": 4.6},
    {"platform": "Clickworker", "title": "Image Annotation Task", "reward": 1.50, "currency": "EUR", "estimated_time": 10, "difficulty": "easy", "rating": 3.5},
    {"platform": "Clickworker", "title": "Data Collection Survey", "reward": 3.00, "currency": "EUR", "estimated_time": 20, "difficulty": "easy", "rating": 3.8},
    {"platform": "Clickworker", "title": "Audio Transcription Task", "reward": 5.00, "currency": "EUR", "estimated_time": 30, "difficulty": "hard", "rating": 3.6},
    {"platform": "Picoworkers", "title": "Quick Survey - 5 minutes", "reward": 0.80, "currency": "USD", "estimated_time": 5, "difficulty": "easy", "rating": 3.2},
    {"platform": "Picoworkers", "title": "App Testing Feedback", "reward": 2.00, "currency": "USD", "estimated_time": 12, "difficulty": "easy", "rating": 3.4},
    {"platform": "Picoworkers", "title": "Website Evaluation Task", "reward": 3.50, "currency": "USD", "estimated_time": 18, "difficulty": "medium", "rating": 3.6},
]

async def generate_samples():
    await init_db()
    
    async with async_session_maker() as session:
        for i, task_data in enumerate(SAMPLE_TASKS):
            task = Task(
                task_id=f"sample_{i+1}",
                platform=task_data["platform"],
                title=task_data["title"],
                description=f"This is a sample survey task for {task_data['title']}. Participants will answer questions related to the survey topic.",
                reward=task_data["reward"],
                currency=task_data["currency"],
                reward_usd=CurrencyService.to_usd(task_data["reward"], task_data["currency"]),
                estimated_time=task_data["estimated_time"],
                url=f"https://example.com/task/{i+1}",
                requirements=["Must be 18+", "English speaker"],
                posted_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
                scraped_at=datetime.utcnow(),
                difficulty=task_data["difficulty"],
                rating=task_data["rating"]
            )
            session.add(task)
        
        await session.commit()
        print(f"Generated {len(SAMPLE_TASKS)} sample tasks")

if __name__ == "__main__":
    asyncio.run(generate_samples())
```

- [ ] **Step 2: 运行示例数据生成**

Run: `cd /workspace && python scripts/generate_samples.py`
Expected: `Generated 12 sample tasks`

---

### 任务 11: 项目配置和文档

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `docker-compose.yml`

- [ ] **Step 1: 创建 README.md**

```markdown
# Survey Hunter - 有奖问卷任务采集工具

从多个众包平台批量采集有奖问卷任务信息，支持数据清洗、排序对比和可视化分析。

## 功能特性

- 🔍 多平台数据采集 (MTurk, Prolific, Clickworker, Picoworkers)
- 📊 数据可视化 (报酬分布、平台对比、性价比分析)
- 💰 自动货币转换
- 🏷️ 性价比标签推荐
- 🔗 一键复制任务链接

## 技术栈

- **后端**: FastAPI + SQLAlchemy + Playwright
- **前端**: React 18 + TypeScript + Recharts
- **数据库**: SQLite

## 快速开始

### 1. 安装后端依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 安装前端依赖

```bash
cd frontend
npm install
```

### 3. 生成示例数据

```bash
python scripts/generate_samples.py
```

### 4. 启动服务

```bash
# 终端1: 启动后端
cd backend
python run.py

# 终端2: 启动前端
cd frontend
npm run dev
```

### 5. 访问应用

打开浏览器访问 http://localhost:3000

## 项目结构

```
survey-hunter/
├── backend/          # FastAPI 后端
│   ├── app/
│   │   ├── api/     # API 路由
│   │   ├── models/  # 数据模型
│   │   ├── scrapers/# 爬虫模块
│   │   └── services/# 服务层
│   └── run.py
├── frontend/        # React 前端
│   └── src/
│       ├── components/  # React 组件
│       ├── api/     # API 客户端
│       └── types/   # TypeScript 类型
├── scripts/         # 工具脚本
└── docs/           # 文档
```

## API 文档

启动后端后访问 http://localhost:8000/docs 查看 API 文档。

## License

MIT
```

- [ ] **Step 2: 创建 .gitignore**

```
# Python
__pycache__/
*.py[cod]
venv/
.venv/
*.db

# Node
node_modules/
dist/
*.log

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 3: 创建 docker-compose.yml**

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - sqlite_data:/app/data
    environment:
      - DATABASE_URL=sqlite+aiosqlite:///./data/survey.db

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  sqlite_data:
```

---

### 任务 12: 最终测试

**Files:**
- Modify: `backend/app/__init__.py`
- Modify: `backend/app/scrapers/__init__.py`
- Modify: `backend/app/services/__init__.py`

- [ ] **Step 1: 确保所有模块可以正确导入**

Run: `cd backend && python -c "from app.main import app; from app.scrapers.factory import ScraperFactory; from app.services.search_service import SearchService; print('All imports OK')"`
Expected: `All imports OK`

- [ ] **Step 2: 验证示例数据**

Run: `cd backend && python -c "import asyncio; from app.database import async_session_maker; from sqlalchemy import select, func; from app.models import Task; async def check(): async with async_session_maker() as s: r = await s.execute(select(func.count(Task.id))); print(f'Total tasks: {r.scalar()}')" && asyncio.run(check())`
Expected: `Total tasks: 12`

- [ ] **Step 3: 测试 API 端点**

Run: `cd backend && timeout 10 python -c "
import asyncio
from app.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Test root
response = client.get('/')
assert response.status_code == 200

# Test tasks
response = client.get('/api/tasks')
assert response.status_code == 200
data = response.json()
assert 'tasks' in data

print('API tests passed!')
"`
Expected: `API tests passed!`

---

## 实施检查清单

- [ ] 任务 1: 后端项目初始化
- [ ] 任务 2: 数据模型定义
- [ ] 任务 3: Pydantic Schemas 定义
- [ ] 任务 4: 爬虫基类和工厂
- [ ] 任务 5: 具体平台爬虫实现
- [ ] 任务 6: 服务层实现
- [ ] 任务 7: API 路由实现
- [ ] 任务 8: 前端项目初始化
- [ ] 任务 9: React 组件实现
- [ ] 任务 10: 集成测试和示例数据
- [ ] 任务 11: 项目配置和文档
- [ ] 任务 12: 最终测试

---

## 依赖说明

| 组件 | 依赖包 | 用途 |
|------|--------|------|
| 后端核心 | fastapi, uvicorn | Web 框架 |
| 数据库 | sqlalchemy, aiosqlite | ORM + SQLite |
| 爬虫 | playwright | 无头浏览器 |
| 前端框架 | react, react-dom | UI 库 |
| 图表 | recharts | 数据可视化 |
| HTTP | axios | API 请求 |
