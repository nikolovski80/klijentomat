"""
S4-02/S4-03: Review request API
"""
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_tenant
from app.models import Lead, Review, Tenant
from app.schemas.reviews import ReviewOut, ReviewStats

router = APIRouter()


@router.post("/trigger/{lead_id}", response_model=ReviewOut, status_code=201)
async def trigger_review(
    lead_id: uuid.UUID,
    platform: str = "google",
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Pošalji email zahtev za recenziju odabranom lead-u."""
    # Dohvati lead
    lead_result = await db.execute(
        select(Lead).where(
            and_(Lead.id == lead_id, Lead.tenant_id == tenant.id)
        )
    )
    lead = lead_result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead nije pronađen")

    if not lead.email:
        raise HTTPException(status_code=400, detail="Lead nema email adresu")

    from app.services.reviewer import send_review_request
    sent = await send_review_request(lead=lead, tenant=tenant, platform=platform)

    # Kreiraj review zapis
    review = Review(
        tenant_id=tenant.id,
        lead_id=lead_id,
        platform=platform,
        request_sent_at=datetime.utcnow() if sent else None,
    )
    db.add(review)
    await db.flush()
    await db.refresh(review)
    return review


@router.get("", response_model=list[ReviewOut])
async def list_reviews(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Lista svih review zahteva tenanta."""
    result = await db.execute(
        select(Review)
        .where(Review.tenant_id == tenant.id)
        .order_by(Review.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/stats", response_model=ReviewStats)
async def review_stats(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    """Statistike review zahteva tenanta."""
    total_result = await db.execute(
        select(func.count()).select_from(Review)
        .where(Review.tenant_id == tenant.id)
    )
    total_sent = total_result.scalar_one()

    completed_result = await db.execute(
        select(func.count()).select_from(Review)
        .where(
            and_(
                Review.tenant_id == tenant.id,
                Review.reviewed_at.isnot(None),
            )
        )
    )
    completed = completed_result.scalar_one()

    return ReviewStats(
        total_sent=total_sent,
        pending=total_sent - completed,
        completed=completed,
    )
