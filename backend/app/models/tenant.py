import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


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
