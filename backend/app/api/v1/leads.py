"""
S2-03: Lead CRUD + scraping + CSV import/export
"""
import csv
import io
import json
import uuid
from typing import Optional

import redis
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_tenant, get_current_user
from app.core.config import settings
from app.models import Lead, LeadStatus, Tenant, User
from app.schemas.leads import (
    LeadCreate, LeadUpdate, LeadOut, LeadListOut,
    LeadStatusUpdate, ScrapeRequest, ScrapeStatusOut,
)

router = APIRouter()


def _redis():
    return redis.from_url(settings.REDIS_URL, decode_responses=True)


# ── List ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=LeadListOut)
async def list_leads(
    status: Optional[LeadStatus] = Query(None),
    city: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    filters = [Lead.tenant_id == tenant.id]
    if status:
        filters.append(Lead.status == status)
    if city:
        filters.append(Lead.city.ilike(f"%{city}%"))
    if industry:
        filters.append(Lead.industry.ilike(f"%{industry}%"))
    if search:
        filters.append(Lead.company_name.ilike(f"%{search}%"))

    total_result = await db.execute(
        select(func.count()).select_from(Lead).where(and_(*filters))
    )
    total = total_result.scalar_one()

    result = await db.execute(
        select(Lead).where(and_(*filters))
        .order_by(Lead.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    items = list(result.scalars().all())

    return LeadListOut(items=items, total=total, skip=skip, limit=limit)


# ── Get one ───────────────────────────────────────────────────────────────────

@router.get("/{lead_id}", response_model=LeadOut)
async def get_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    result = await db.execute(
        select(Lead).where(and_(Lead.id == lead_id, Lead.tenant_id == tenant.id))
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead nije pronađen")
    return lead


# ── Create ────────────────────────────────────────────────────────────────────

@router.post("", response_model=LeadOut, status_code=201)
async def create_lead(
    data: LeadCreate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    # Dedup
    await _check_duplicate(db, tenant.id, data.email, data.company_name)

    lead = Lead(tenant_id=tenant.id, **data.model_dump())
    db.add(lead)
    await db.flush()
    await db.refresh(lead)
    return lead


# ── Update ────────────────────────────────────────────────────────────────────

@router.put("/{lead_id}", response_model=LeadOut)
async def update_lead(
    lead_id: uuid.UUID,
    data: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    lead = await _get_or_404(db, lead_id, tenant.id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(lead, field, value)
    await db.flush()
    await db.refresh(lead)
    return lead


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/{lead_id}", status_code=204)
async def delete_lead(
    lead_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    lead = await _get_or_404(db, lead_id, tenant.id)
    await db.delete(lead)


# ── Update status ─────────────────────────────────────────────────────────────

@router.patch("/{lead_id}/status", response_model=LeadOut)
async def update_lead_status(
    lead_id: uuid.UUID,
    data: LeadStatusUpdate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    lead = await _get_or_404(db, lead_id, tenant.id)
    lead.status = data.status
    await db.flush()
    await db.refresh(lead)
    return lead


# ── Scrape (Celery) ───────────────────────────────────────────────────────────

@router.post("/scrape", status_code=202)
async def start_scrape(
    data: ScrapeRequest,
    tenant: Tenant = Depends(get_current_tenant),
    user: User = Depends(get_current_user),
):
    from app.tasks.scraping import scrape_places

    task = scrape_places.delay(
        tenant_id=str(tenant.id),
        address=data.address,
        radius=data.radius,
        industry=data.industry,
        user_id=str(user.id),
        max_results=data.max_results,
    )
    # Postavi inicijelni status u Redis
    r = _redis()
    r.setex(f"scrape:{task.id}", 3600, json.dumps({"status": "queued", "count": 0, "error": ""}))

    return {"task_id": task.id, "status": "queued"}


@router.get("/scrape/{task_id}", response_model=ScrapeStatusOut)
async def scrape_status(task_id: str):
    r = _redis()
    raw = r.get(f"scrape:{task_id}")
    if not raw:
        raise HTTPException(status_code=404, detail="Task nije pronađen")
    data = json.loads(raw)
    return ScrapeStatusOut(
        task_id=task_id,
        status=data.get("status", "unknown"),
        count=data.get("count", 0),
        error=data.get("error") or None,
    )


# ── CSV Import ────────────────────────────────────────────────────────────────

@router.post("/import", status_code=201)
async def import_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    content = await file.read()
    text = content.decode("utf-8-sig")  # utf-8-sig da ignoriše BOM
    reader = csv.DictReader(io.StringIO(text))

    imported = 0
    skipped = 0

    for row in reader:
        company_name = (row.get("company_name") or row.get("naziv") or "").strip()
        email = (row.get("email") or "").strip() or None
        if not company_name:
            skipped += 1
            continue

        # Dedup
        dup = await _check_duplicate_soft(db, tenant.id, email, company_name)
        if dup:
            skipped += 1
            continue

        lead = Lead(
            tenant_id=tenant.id,
            company_name=company_name,
            email=email,
            phone=(row.get("phone") or row.get("telefon") or "").strip() or None,
            city=(row.get("city") or row.get("grad") or "").strip() or None,
            address=(row.get("address") or row.get("adresa") or "").strip() or None,
            website=(row.get("website") or "").strip() or None,
            industry=(row.get("industry") or row.get("delatnost") or "").strip() or None,
            source="csv_import",
        )
        db.add(lead)
        imported += 1

    await db.flush()
    return {"imported": imported, "skipped": skipped}


# ── CSV Export ────────────────────────────────────────────────────────────────

@router.get("/export")
async def export_csv(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    result = await db.execute(
        select(Lead)
        .where(Lead.tenant_id == tenant.id)
        .order_by(Lead.created_at.desc())
    )
    leads = list(result.scalars().all())

    output = io.StringIO()
    fieldnames = ["company_name", "email", "phone", "city", "address", "website", "industry", "status", "source", "created_at"]
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for lead in leads:
        writer.writerow({
            "company_name": lead.company_name,
            "email": lead.email or "",
            "phone": lead.phone or "",
            "city": lead.city or "",
            "address": lead.address or "",
            "website": lead.website or "",
            "industry": lead.industry or "",
            "status": lead.status.value,
            "source": lead.source or "",
            "created_at": lead.created_at.isoformat(),
        })

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=leads.csv"},
    )


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _get_or_404(db: AsyncSession, lead_id: uuid.UUID, tenant_id: uuid.UUID) -> Lead:
    result = await db.execute(
        select(Lead).where(and_(Lead.id == lead_id, Lead.tenant_id == tenant_id))
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead nije pronađen")
    return lead


async def _check_duplicate(
    db: AsyncSession, tenant_id: uuid.UUID, email: str | None, company_name: str
):
    """Baca HTTPException ako postoji duplikat."""
    if await _check_duplicate_soft(db, tenant_id, email, company_name):
        raise HTTPException(status_code=409, detail="Lead već postoji (duplikat)")


async def _check_duplicate_soft(
    db: AsyncSession, tenant_id: uuid.UUID, email: str | None, company_name: str
) -> bool:
    """Vraća True ako postoji duplikat, False inače."""
    conditions = [Lead.tenant_id == tenant_id, Lead.company_name == company_name]
    result = await db.execute(select(Lead).where(and_(*conditions)))
    if result.scalar_one_or_none():
        return True

    if email:
        result2 = await db.execute(
            select(Lead).where(and_(Lead.tenant_id == tenant_id, Lead.email == email))
        )
        if result2.scalar_one_or_none():
            return True

    return False
