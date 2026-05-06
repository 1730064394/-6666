# 有奖问卷任务采集与对比系统 - 设计文档

## 1. 项目概述

### 1.1 项目目标
从主流众包平台和社交平台批量抓取有奖问卷任务信息，自动清洗去重，按任务报酬排序，支持价格趋势分析和性价比推荐。

### 1.2 核心功能
- **多平台数据采集**: 支持 Amazon MTurk、Clickworker、Prolific、Picoworkers 等众包平台
- **关键词搜索**: 支持用户输入关键词筛选任务
- **数据清洗去重**: 自动去重、补全、标准化
- **排序与对比**: 按报酬从低到高排序，支持横向对比
- **价格趋势图表**: 展示历史价格走势
- **性价比推荐**: 标注高性价比任务

---

## 2. 系统架构

### 2.1 技术栈
- **后端**: FastAPI + Python 3.10+
- **前端**: React 18 + TypeScript + Vite
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **任务队列**: BackgroundTasks (内建) / Celery (可选扩展)
- **爬虫**: Playwright (无头浏览器)
- **图表**: Recharts

### 2.2 架构图
```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Dashboard │  │ Search   │  │ Task List│  │ Charts   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                              │ REST API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Task API │  │ Scrapers │  │ Analyzer │  │ History  │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
└───────┼─────────────┼─────────────┼─────────────┼──────────┘
        │             │             │             │
        ▼             ▼             ▼             ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Database   │ │  Scrapers   │ │  Analytics  │ │   Cache     │
│  (SQLite)   │ │  (Playwright)│ │  Engine     │ │  (Redis)    │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

---

## 3. 数据模型

### 3.1 任务(Task)实体
```python
class Task:
    id: str                    # 唯一标识 (UUID)
    platform: str              # 平台名称
    title: str                 # 任务标题
    description: str           # 任务描述
    reward: float              # 报酬金额
    currency: str              # 货币类型 (USD/EUR/GBP)
    estimated_time: int        # 预计完成时间(分钟)
    url: str                   # 任务链接
    requirements: List[str]    # 参与要求
    posted_at: datetime        # 发布时间
    scraped_at: datetime       # 采集时间
    category: str              # 任务分类
    difficulty: str            # 难度等级 (easy/medium/hard)
    rating: float              # 平台评分 (1-5)
```

### 3.2 搜索任务(SearchJob)实体
```python
class SearchJob:
    id: str                    # 任务ID
    keyword: str               # 搜索关键词
    platforms: List[str]       # 目标平台
    status: str                # pending/running/completed/failed
    started_at: datetime       # 开始时间
    completed_at: datetime     # 完成时间
    results_count: int         # 结果数量
    error_message: str         # 错误信息
```

---

## 4. 数据采集核心逻辑

### 4.1 爬虫工厂模式
```
┌─────────────────────────────────────────┐
│           ScraperFactory                │
│  - create_scraper(platform) -> Scraper │
└─────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬───────────┐
        ▼           ▼           ▼           ▼
   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
   │ MTurk  │ │Prolific│ │Clickwrk│ │Picowrk │
   │Scraper │ │Scraper │ │Scraper │ │Scraper │
   └────────┘ └────────┘ └────────┘ └────────┘
```

### 4.2 采集流程
1. **初始化**: 启动 Playwright 浏览器实例
2. **登录**: 处理平台登录 (Cookie/JWT)
3. **搜索**: 根据关键词导航到搜索结果页
4. **分页**: 遍历所有分页，收集任务链接
5. **详情**: 访问每个任务详情页，提取结构化数据
6. **存储**: 保存到数据库，标记采集时间
7. **清理**: 关闭浏览器，释放资源

### 4.3 反爬应对策略
- **User-Agent 轮换**: 随机 UA 列表
- **请求间隔**: 3-10秒随机延迟
- **IP 轮换**: 代理池支持 (可选)
- **验证码处理**: 人工打码接口集成 (可选)

### 4.4 支持平台

| 平台 | URL模式 | 登录方式 | 数据结构 |
|------|---------|----------|----------|
| Amazon MTurk | mturk.com | AWS凭证 | JSON API |
| Prolific | prolific.co | 邮箱登录 | GraphQL |
| Clickworker | clickworker.com | 邮箱登录 | REST API |
| Picoworkers | picoworkers.com | 邮箱登录 | REST API |
| Reddit | reddit.com | Reddit账户 | PRAW API |
| Twitter | twitter.com | Twitter账户 | Twitter API v2 |

---

## 5. 数据处理逻辑

### 5.1 清洗流程
```
原始数据 → 去重检查 → 字段标准化 → 货币转换 → 数据验证 → 存储
```

- **去重**: 基于 (平台+任务ID) 唯一键去重
- **标准化**: 统一时间格式、清理HTML标签
- **货币转换**: 实时汇率转换为统一货币 (USD)
- **验证**: 报酬范围检查、时间合理性检查

### 5.2 排序规则
1. **按报酬排序**: 默认升序 (低→高)
2. **按性价比排序**: reward / estimated_time
3. **按发布时间排序**: 最新优先
4. **按难度排序**: easy → hard

### 5.3 性价比计算
```
性价比指数 = (报酬金额 × 平台评分) / (预计时间 × 难度系数)
难度系数: easy=1.0, medium=1.5, hard=2.0
```

---

## 6. 数据可视化方案

### 6.1 Dashboard 页面
- **统计卡片**: 总任务数、平均报酬、最高报酬、采集平台数
- **实时进度**: 搜索任务执行状态和进度条

### 6.2 任务列表
- **表格视图**: 可排序、可筛选、分页
- **快速操作**: 一键复制链接、打开链接
- **状态标记**: 性价比标签 (推荐/一般/较低)

### 6.3 图表组件
- **报酬分布直方图**: 展示报酬区间分布
- **平台对比柱状图**: 各平台任务数量和平均报酬
- **价格趋势线图**: 任务报酬随时间变化
- **散点图**: 报酬 vs 时间的分布

### 6.4 性价比标签
| 标签 | 条件 | 颜色 |
|------|------|------|
| ⭐ 超值推荐 | 性价比指数 > 8 | 绿色 |
| 👍 性价比高 | 性价比指数 5-8 | 蓝色 |
| 💰 正常 | 性价比指数 2-5 | 灰色 |
| ⚠️ 偏低 | 性价比指数 < 2 | 橙色 |

---

## 7. API 设计

### 7.1 REST Endpoints

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/search | 创建搜索任务 |
| GET | /api/search/{id} | 获取搜索任务状态 |
| GET | /api/tasks | 获取任务列表 (支持分页、筛选) |
| GET | /api/tasks/{id} | 获取任务详情 |
| GET | /api/analytics/summary | 获取统计摘要 |
| GET | /api/analytics/chart/{type} | 获取图表数据 |
| DELETE | /api/tasks/{id} | 删除任务 |

### 7.2 请求/响应示例

**创建搜索任务**
```json
POST /api/search
Request:
{
  "keyword": "survey",
  "platforms": ["mturk", "prolific"],
  "filters": {
    "min_reward": 1.0,
    "max_time": 30
  }
}

Response:
{
  "job_id": "abc123",
  "status": "running",
  "message": "搜索任务已启动"
}
```

**获取任务列表**
```json
GET /api/tasks?keyword=survey&sort_by=reward&order=asc&page=1&limit=20

Response:
{
  "total": 156,
  "page": 1,
  "limit": 20,
  "tasks": [
    {
      "id": "task001",
      "platform": "mturk",
      "title": "15min Survey",
      "reward": 2.50,
      "estimated_time": 15,
      "性价比指数": 7.5,
      "标签": "性价比高"
    }
  ]
}
```

---

## 8. 项目结构

```
survey-hunter/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── routes/
│   │   │   │   ├── search.py
│   │   │   │   ├── tasks.py
│   │   │   │   └── analytics.py
│   │   │   └── deps.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── task.py
│   │   │   └── search_job.py
│   │   ├── schemas/
│   │   │   ├── task.py
│   │   │   └── search.py
│   │   ├── scrapers/
│   │   │   ├── base.py
│   │   │   ├── factory.py
│   │   │   ├── mturk.py
│   │   │   ├── prolific.py
│   │   │   ├── clickworker.py
│   │   │   └── picoworkers.py
│   │   ├── services/
│   │   │   ├── search_service.py
│   │   │   ├── analytics_service.py
│   │   │   └── currency_service.py
│   │   └── main.py
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/
│   │   │   ├── TaskList/
│   │   │   ├── TaskDetail/
│   │   │   ├── SearchForm/
│   │   │   └── Charts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 9. 安全性考虑

### 9.1 凭证管理
- 平台登录凭证存储在环境变量或加密配置中
- 不在前端代码中暴露任何敏感信息

### 9.2 速率限制
- API 请求限流: 100请求/分钟
- 爬虫请求间隔: 3-10秒随机

### 9.3 数据隐私
- 不收集用户个人信息
- 任务数据仅用于对比分析

---

## 10. 部署方案

### 10.1 开发环境
```bash
# 后端
cd backend
pip install -r requirements.txt
python run.py

# 前端
cd frontend
npm install
npm run dev
```

### 10.2 Docker 部署 (生产)
```yaml
# docker-compose.yml
services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment:
      - DATABASE_URL=sqlite:///./data/survey.db

  frontend:
    build: ./frontend
    ports: ["3000:80"]
```

---

## 11. 数据示例

### 11.1 示例任务数据
```json
{
  "id": "mturk_A3LD1234",
  "platform": "Amazon MTurk",
  "title": "30-minute Consumer Survey about Shopping Habits",
  "description": "Complete a survey about your shopping preferences...",
  "reward": 4.50,
  "currency": "USD",
  "estimated_time": 30,
  "url": "https://worker.mturk.com/projects/12345",
  "requirements": ["Masters qualifed", "95% approval rate"],
  "posted_at": "2024-01-15T10:30:00Z",
  "性价比指数": 6.75,
  "标签": "性价比高"
}
```

### 11.2 示例图表数据
```json
{
  "reward_distribution": [
    {"range": "0-2", "count": 45},
    {"range": "2-5", "count": 78},
    {"range": "5-10", "count": 32},
    {"range": "10+", "count": 8}
  ],
  "platform_comparison": [
    {"platform": "MTurk", "avg_reward": 3.2, "task_count": 85},
    {"platform": "Prolific", "avg_reward": 5.8, "task_count": 120},
    {"platform": "Clickworker", "avg_reward": 2.1, "task_count": 56}
  ]
}
```
