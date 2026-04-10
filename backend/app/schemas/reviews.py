import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ReviewOut(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    lead_id: uuid.UUID
    platform: str
    request_sent_at: Optional[datetime] = None
    reminder_sent_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReviewStats(BaseModel):
    total_sent: int
    pending: int      # Poslato ali bez reviewed_at
    completed: int    # Ima reviewed_at
