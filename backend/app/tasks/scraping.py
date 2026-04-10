"""
S2-02: Celery task za Google Places scraping.
Celery taskovi su sync — koristimo asyncio.run() za async servis.
"""
import asyncio
import json
import uuid
from datetime import datetime

import redis
from sqlalchemy import select, and_

from app.tasks.celery_app import celery_app
from app.core.config import settings


def _get_redis():
    return redis.from_url(settings.REDIS_URL, decode_responses=True)


def _set_status(r, task_id: str, status: str, count: int = 0, error: str | None = None):
    data = {"status": status, "count": count, "error": error or ""}
    r.setex(f"scrape:{task_id}", 3600, json.dumps(data))


@celery_app.task(name="app.tasks.scraping.scrape_places", bind=True)
def scrape_places(
    self,
    tenant_id: str,
    address: str,
    radius: int,
    industry: str,
    user_id: str,
    max_results: int = 50,
):
    """Pokreće scraping i čuva leadove u DB. Status se prati u Redis."""
    r = _get_redis()
    task_id = self.request.id

    _set_status(r, task_id, "running")

    try:
        results = asyncio.run(_do_scrape(address, radius, industry, max_results))
        count = asyncio.run(_save_leads(tenant_id, results))
        _set_status(r, task_id, "done", count=count)
    except Exception as exc:
        _set_status(r, task_id, "error", error=str(exc))
        raise


async def _do_scrape(address: str, radius: int, industry: str, max_results: int) -> list[dict]:
    from app.services.scraper import search_places
    return await search_places(address, radius, industry, max_results)


async def _save_leads(tenant_id_str: str, places: list[dict]) -> int:
    """Bulk insert leadova sa dedup po (tenant_id, email) i (tenant_id, company_name)."""
    from app.core.database import AsyncSessionLocal
    from app.models import Lead

    tenant_id = uuid.UUID(tenant_id_str)
    saved = 0

    async with AsyncSessionLocal() as db:
        for place in places:
            company_name = place.get("company_name", "").strip()
            email = place.get("email")

            # Dedup po company_name
            exists = await db.execute(
                select(Lead).where(
                    and_(
                        Lead.tenant_id == tenant_id,
                        Lead.company_name == company_name,
                    )
                )
            )
            if exists.scalar_one_or_none():
                continue

            # Dedup po email ako postoji
            if email:
                exists_email = await db.execute(
                    select(Lead).where(
                        and_(
                            Lead.tenant_id == tenant_id,
                            Lead.email == email,
                        )
                    )
                )
                if exists_email.scalar_one_or_none():
                    continue

            lead = Lead(
                tenant_id=tenant_id,
                company_name=company_name,
                email=email,
                phone=place.get("phone"),
                address=place.get("address"),
                city=place.get("city"),
                website=place.get("website"),
                source=place.get("source", "google_places"),
                industry=None,  # biće popunjeno iz pretrage
            )
            db.add(lead)
            saved += 1

        await db.commit()

    return saved
