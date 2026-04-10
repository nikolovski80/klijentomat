import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.lead import LeadStatus


class LeadCreate(BaseModel):
    company_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    industry: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    source: Optional[str] = None


class LeadUpdate(BaseModel):
    company_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    industry: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    status: Optional[LeadStatus] = None


class LeadStatusUpdate(BaseModel):
    status: LeadStatus


class LeadOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    company_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    industry: Optional[str] = None
    city: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    status: LeadStatus
    source: Optional[str] = None
    is_unsubscribed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class LeadListOut(BaseModel):
    items: list[LeadOut]
    total: int
    skip: int
    limit: int


class ScrapeRequest(BaseModel):
    address: str
    radius: int = 5000  # u metrima
    industry: str
    max_results: int = 50


class ScrapeStatusOut(BaseModel):
    task_id: str
    status: str  # queued, running, done, error
    count: int = 0
    error: Optional[str] = None
