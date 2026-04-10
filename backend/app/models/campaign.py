import uuid
import enum
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text, Integer, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


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
