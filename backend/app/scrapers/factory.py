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
