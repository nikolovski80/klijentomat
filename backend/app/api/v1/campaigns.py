"""
S3-04: Campaign CRUD + send + stats + AI pisanje
"""
import uuid
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException

from app.core.database import get_db
from app.core.deps import get_current_tenant
from app.models import Campaign, CampaignStatus, EmailLog, Tenant, KnowledgeItem
from app.schemas.campaigns import (
    CampaignCreate, CampaignUpdate, CampaignOut, CampaignStats,
    AiWriteRequest, AiWriteResponse,
)

router = APIRouter()


# ── List ──────────────────────────────────────────────────────────────────────

@router.get("", response_model=list[CampaignOut])
async def list_campaigns(
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    result = await db.execute(
        select(Campaign)
        .where(Campaign.tenant_id == tenant.id)
        .order_by(Campaign.created_at.desc())
    )
    return list(result.scalars().all())


# ── Get one ───────────────────────────────────────────────────────────────────

@router.get("/{campaign_id}", response_model=CampaignOut)
async def get_campaign(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    return await _get_or_404(db, campaign_id, tenant.id)


# ── Create ────────────────────────────────────────────────────────────────────

@router.post("", response_model=CampaignOut, status_code=201)
async def create_campaign(
    data: CampaignCreate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    campaign = Campaign(tenant_id=tenant.id, **data.model_dump())
    db.add(campaign)
    await db.flush()
    await db.refresh(campaign)
    return campaign


# ── Update ────────────────────────────────────────────────────────────────────

@router.put("/{campaign_id}", response_model=CampaignOut)
async def update_campaign(
    campaign_id: uuid.UUID,
    data: CampaignUpdate,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    campaign = await _get_or_404(db, campaign_id, tenant.id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(campaign, field, value)
    await db.flush()
    await db.refresh(campaign)
    return campaign


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/{campaign_id}", status_code=204)
async def delete_campaign(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    campaign = await _get_or_404(db, campaign_id, tenant.id)
    await db.delete(campaign)


# ── Send (Celery) ─────────────────────────────────────────────────────────────

@router.post("/{campaign_id}/send", status_code=202)
async def send_campaign(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    campaign = await _get_or_404(db, campaign_id, tenant.id)
    if campaign.status not in (CampaignStatus.draft, CampaignStatus.scheduled):
        raise HTTPException(status_code=400, detail="Kampanja se ne može poslati u ovom statusu")

    from app.tasks.email_send import send_campaign as celery_send
    task = celery_send.delay(str(campaign_id), str(tenant.id))
    return {"task_id": task.id, "status": "queued"}


# ── Stats ──────────────────────────────────────────────────────────────────────

@router.get("/{campaign_id}/stats", response_model=CampaignStats)
async def campaign_stats(
    campaign_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    await _get_or_404(db, campaign_id, tenant.id)

    sent_result = await db.execute(
        select(func.count()).select_from(EmailLog)
        .where(and_(EmailLog.campaign_id == campaign_id, EmailLog.sent_at.isnot(None)))
    )
    sent_count = sent_result.scalar_one()

    opened_result = await db.execute(
        select(func.count()).select_from(EmailLog)
        .where(and_(EmailLog.campaign_id == campaign_id, EmailLog.opened_at.isnot(None)))
    )
    opened_count = opened_result.scalar_one()

    clicked_result = await db.execute(
        select(func.count()).select_from(EmailLog)
        .where(and_(EmailLog.campaign_id == campaign_id, EmailLog.clicked_at.isnot(None)))
    )
    clicked_count = clicked_result.scalar_one()

    open_rate = opened_count / sent_count if sent_count > 0 else 0.0
    click_rate = clicked_count / sent_count if sent_count > 0 else 0.0

    return CampaignStats(
        campaign_id=campaign_id,
        sent_count=sent_count,
        opened_count=opened_count,
        clicked_count=clicked_count,
        open_rate=open_rate,
        click_rate=click_rate,
    )


# ── AI Write ──────────────────────────────────────────────────────────────────

@router.post("/ai-write", response_model=AiWriteResponse)
async def ai_write(
    data: AiWriteRequest,
    db: AsyncSession = Depends(get_db),
    tenant: Tenant = Depends(get_current_tenant),
):
    from app.services.ai_writer import generate_email

    # Dohvati knowledge kontekst tenanta
    knowledge_result = await db.execute(
        select(KnowledgeItem).where(KnowledgeItem.tenant_id == tenant.id)
    )
    items = knowledge_result.scalars().all()
    knowledge_context = "\n".join(f"{item.key}: {item.value}" for item in items)

    result = await generate_email(
        industry=data.industry,
        tone=data.tone,
        knowledge_context=knowledge_context,
        lead_company_name=data.lead_company_name or "",
    )
    return AiWriteResponse(**result)


# ── Helper ─────────────────────────────────────────────────────────────────────

async def _get_or_404(db: AsyncSession, campaign_id: uuid.UUID, tenant_id: uuid.UUID) -> Campaign:
    result = await db.execute(
        select(Campaign).where(
            and_(Campaign.id == campaign_id, Campaign.tenant_id == tenant_id)
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise HTTPException(status_code=404, detail="Kampanja nije pronađena")
    return campaign
