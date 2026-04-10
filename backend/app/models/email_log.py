import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


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
