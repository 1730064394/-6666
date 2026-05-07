import asyncio
import random
from datetime import datetime, timedelta
from app.database import async_session_maker, init_db
from app.models import Task

SAMPLE_TASKS = [
    {
        "platform": "Amazon MTurk",
        "task_id": "sample_1",
        "title": "15-minute Consumer Survey about Shopping Habits",
        "description": "This is a sample survey task for 15-minute Consumer Survey about Shopping Habits. Participants will answer questions related to the survey topic.",
        "reward": 2.5,
        "currency": "USD",
        "estimated_time": 15,
        "url": "https://example.com/task/1",
        "requirements": ["Must be 18+", "English speaker"],
        "difficulty": "easy",
        "rating": 4.2,
    },
    {
        "platform": "Amazon MTurk",
        "task_id": "sample_2",
        "title": "30-minute Academic Research Survey",
        "description": "This is a sample survey task for 30-minute Academic Research Survey. Participants will answer questions related to the survey topic.",
        "reward": 5.0,
        "currency": "USD",
        "estimated_time": 30,
        "url": "https://example.com/task/2",
        "requirements": ["Must be 18+", "English speaker"],
        "difficulty": "medium",
        "rating": 4.5,
    },
    {
        "platform": "Amazon MTurk",
        "task_id": "sample_3",
        "title": "Product Feedback Survey - Electronics",
        "description": "This is a sample survey task for Product Feedback Survey - Electronics. Participants will answer questions related to the survey topic.",
        "reward": 3.75,
        "currency": "USD",
        "estimated_time": 20,
        "url": "https://example.com/task/3",
        "requirements": ["Must be 18+", "English speaker"],
        "difficulty": "easy",
        "rating": 4.0,
    },
    {
        "platform": "Prolific",
        "task_id": "sample_4",
        "title": "Psychology Research Study",
        "description": "This is a sample survey task for Psychology Research Study. Participants will answer questions related to the survey topic.",
        "reward": 8.5,
        "currency": "GBP",
        "estimated_time": 45,
        "url": "https://example.com/task/4",
        "requirements": ["Must be 18+", "University student"],
        "difficulty": "hard",
        "rating": 4.8,
    },
    {
        "platform": "Prolific",
        "task_id": "sample_5",
        "title": "Market Research Questionnaire",
        "description": "This is a sample survey task for Market Research Questionnaire. Participants will answer questions related to the survey topic.",
        "reward": 4.0,
        "currency": "GBP",
        "estimated_time": 25,
        "url": "https://example.com/task/5",
        "requirements": ["Must be 18+", "UK resident"],
        "difficulty": "medium",
        "rating": 4.3,
    },
    {
        "platform": "Clickworker",
        "task_id": "sample_6",
        "title": "Image Annotation Task",
        "description": "This is a sample survey task for Image Annotation Task. Participants will answer questions related to the survey topic.",
        "reward": 3.0,
        "currency": "EUR",
        "estimated_time": 12,
        "url": "https://example.com/task/6",
        "requirements": ["Must be 18+", "Attention to detail"],
        "difficulty": "easy",
        "rating": 3.8,
    },
    {
        "platform": "Clickworker",
        "task_id": "sample_7",
        "title": "Content Moderation Review",
        "description": "This is a sample survey task for Content Moderation Review. Participants will answer questions related to the survey topic.",
        "reward": 6.5,
        "currency": "EUR",
        "estimated_time": 35,
        "url": "https://example.com/task/7",
        "requirements": ["Must be 18+", "Good judgment"],
        "difficulty": "medium",
        "rating": 4.1,
    },
    {
        "platform": "Clickworker",
        "task_id": "sample_8",
        "title": "Data Validation Task",
        "description": "This is a sample survey task for Data Validation Task. Participants will answer questions related to the survey topic.",
        "reward": 4.2,
        "currency": "EUR",
        "estimated_time": 18,
        "url": "https://example.com/task/8",
        "requirements": ["Must be 18+", "Data entry experience"],
        "difficulty": "medium",
        "rating": 3.9,
    },
    {
        "platform": "Picoworkers",
        "task_id": "sample_9",
        "title": "Social Media Engagement Task",
        "description": "This is a sample survey task for Social Media Engagement Task. Participants will answer questions related to the survey topic.",
        "reward": 1.2,
        "currency": "USD",
        "estimated_time": 8,
        "url": "https://example.com/task/9",
        "requirements": ["Must be 18+"],
        "difficulty": "easy",
        "rating": 3.5,
    },
    {
        "platform": "Picoworkers",
        "task_id": "sample_10",
        "title": "Quick Survey - 5 minutes",
        "description": "This is a sample survey task for Quick Survey - 5 minutes. Participants will answer questions related to the survey topic.",
        "reward": 0.8,
        "currency": "USD",
        "estimated_time": 5,
        "url": "https://example.com/task/10",
        "requirements": ["Must be 18+", "English speaker"],
        "difficulty": "easy",
        "rating": 3.2,
    },
    {
        "platform": "Picoworkers",
        "task_id": "sample_11",
        "title": "App Testing Feedback",
        "description": "This is a sample survey task for App Testing Feedback. Participants will answer questions related to the survey topic.",
        "reward": 2.0,
        "currency": "USD",
        "estimated_time": 12,
        "url": "https://example.com/task/11",
        "requirements": ["Must be 18+", "English speaker"],
        "difficulty": "easy",
        "rating": 3.4,
    },
    {
        "platform": "Picoworkers",
        "task_id": "sample_12",
        "title": "Website Evaluation Task",
        "description": "This is a sample survey task for Website Evaluation Task. Participants will answer questions related to the survey topic.",
        "reward": 3.5,
        "currency": "USD",
        "estimated_time": 18,
        "url": "https://example.com/task/12",
        "requirements": ["Must be 18+", "English speaker"],
        "difficulty": "medium",
        "rating": 3.6,
    },
]


async def generate_samples():
    await init_db()
    
    async with async_session_maker() as session:
        for task_data in SAMPLE_TASKS:
            reward_usd = task_data["reward"]
            if task_data["currency"] == "GBP":
                reward_usd = round(task_data["reward"] * 1.27, 2)
            elif task_data["currency"] == "EUR":
                reward_usd = round(task_data["reward"] * 1.08, 2)
            
            task = Task(
                platform=task_data["platform"],
                task_id=task_data["task_id"],
                title=task_data["title"],
                description=task_data["description"],
                reward=task_data["reward"],
                currency=task_data["currency"],
                reward_usd=reward_usd,
                estimated_time=task_data["estimated_time"],
                url=task_data["url"],
                requirements=task_data["requirements"],
                posted_at=datetime.now() - timedelta(days=random.randint(0, 30)),
                scraped_at=datetime.now(),
                difficulty=task_data["difficulty"],
                rating=task_data["rating"],
            )
            session.add(task)
        
        await session.commit()
        print(f"Generated {len(SAMPLE_TASKS)} sample tasks")


if __name__ == "__main__":
    asyncio.run(generate_samples())
