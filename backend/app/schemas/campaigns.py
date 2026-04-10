import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.campaign import CampaignStatus


class CampaignCreate(BaseModel):
    name: str
    subject: str
    body_html: str
    from_email: str
    from_name: str
    industry_target: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    followup_days: int = 3
    followup_subject: Optional[str] = None
    followup_html: Optional[str] = None


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body_html: Optional[str] = None
    from_email: Optional[str] = None
    from_name: Optional[str] = None
    industry_target: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    followup_days: Optional[int] = None
    followup_subject: Optional[str] = None
    followup_html: Optional[str] = None


class CampaignOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    subject: str
    body_html: str
    from_email: str
    from_name: str
    status: CampaignStatus
    industry_target: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    followup_days: int
    followup_subject: Optional[str] = None
    followup_html: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class CampaignStats(BaseModel):
    campaign_id: uuid.UUID
    sent_count: int
    opened_count: int
    clicked_count: int
    open_rate: float  # 0.0-1.0
    click_rate: float  # 0.0-1.0


class AiWriteRequest(BaseModel):
    industry: str
    tone: str = "formalan"
    lead_company_name: Optional[str] = None


class AiWriteResponse(BaseModel):
    subject: str
    body_html: str
