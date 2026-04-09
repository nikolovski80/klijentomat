import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Text, Float, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
import enum


# ─── TENANT ───────────────────────────────────────────────
class PlanType(str, enum.Enum):
    tehnicar = "tehnicar"
    komercijalista = "komercijalista"
    sefica = "sefica"


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    plan: Mapped[PlanType] = mapped_column(Enum(PlanType), default=PlanType.tehnicar)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    stripe_customer_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    users: Mapped[list["User"]] = relationship(back_populates="tenant")
    leads: Mapped[list["Lead"]] = relationship(back_populates="tenant")
    campaigns: Mapped[list["Campaign"]] = relationship(back_populates="tenant")
    knowledge_items: Mapped[list["KnowledgeItem"]] = relationship(back_populates="tenant")


# ─── USER ─────────────────────────────────────────────────
class UserRole(str, enum.Enum):
    owner = "owner"
    admin = "admin"
    viewer = "viewer"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.owner)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tenant: Mapped["Tenant"] = relationship(back_populates="users")


# ─── LEAD ─────────────────────────────────────────────────
class LeadStatus(str, enum.Enum):
    new = "new"
    sent = "sent"
    opened = "opened"
    replied = "replied"
    followup = "followup"
    no_response = "no_response"
    converted = "converted"


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    company_name: Mapped[str] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[LeadStatus] = mapped_column(Enum(LeadStatus), default=LeadStatus.new)
    source: Mapped[str | None] = mapped_column(String(50), nullable=True)  # google_places, csv, manual
    is_unsubscribed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tenant: Mapped["Tenant"] = relationship(back_populates="leads")
    email_logs: Mapped[list["EmailLog"]] = relationship(back_populates="lead")


# ─── CAMPAIGN ─────────────────────────────────────────────
class CampaignStatus(str, enum.Enum):
    draft = "draft"
    scheduled = "scheduled"
    active = "active"
    paused = "paused"
    finished = "finished"


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    subject: Mapped[str] = mapped_column(String(500))
    body_html: Mapped[str] = mapped_column(Text)
    from_email: Mapped[str] = mapped_column(String(255))
    from_name: Mapped[str] = mapped_column(String(255))
    status: Mapped[CampaignStatus] = mapped_column(Enum(CampaignStatus), default=CampaignStatus.draft)
    industry_target: Mapped[str | None] = mapped_column(String(100), nullable=True)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    followup_days: Mapped[int] = mapped_column(Integer, default=3)
    followup_subject: Mapped[str | None] = mapped_column(String(500), nullable=True)
    followup_html: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    tenant: Mapped["Tenant"] = relationship(back_populates="campaigns")
    email_logs: Mapped[list["EmailLog"]] = relationship(back_populates="campaign")


# ─── EMAIL LOG ────────────────────────────────────────────
class EmailLog(Base):
    __tablename__ = "email_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id"), index=True)
    campaign_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campaigns.id"), index=True)
    tracking_token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    is_followup: Mapped[bool] = mapped_column(Boolean, default=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    opened_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    clicked_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    open_count: Mapped[int] = mapped_column(Integer, default=0)

    lead: Mapped["Lead"] = relationship(back_populates="email_logs")
    campaign: Mapped["Campaign"] = relationship(back_populates="email_logs")


# ─── KNOWLEDGE BASE ───────────────────────────────────────
class KnowledgeItem(Base):
    __tablename__ = "knowledge_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    category: Mapped[str] = mapped_column(String(100))  # firma, cenovnik, branding, faq...
    key: Mapped[str] = mapped_column(String(255))
    value: Mapped[str] = mapped_column(Text)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant: Mapped["Tenant"] = relationship(back_populates="knowledge_items")


# ─── REVIEW ───────────────────────────────────────────────
class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tenants.id"), index=True)
    lead_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("leads.id"), index=True)
    platform: Mapped[str] = mapped_column(String(50), default="google")  # google, trustpilot
    request_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    reminder_sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
