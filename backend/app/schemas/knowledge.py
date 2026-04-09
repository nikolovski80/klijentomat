import uuid
from datetime import datetime
from pydantic import BaseModel


class KnowledgeItemOut(BaseModel):
    id: uuid.UUID
    category: str
    key: str
    value: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeUpsertItem(BaseModel):
    key: str
    value: str


class KnowledgeCategoryUpsert(BaseModel):
    items: list[KnowledgeUpsertItem]


class KnowledgeCategoryOut(BaseModel):
    category: str
    items: list[KnowledgeItemOut]


class KnowledgeAllOut(BaseModel):
    # category -> list of items
    categories: dict[str, list[KnowledgeItemOut]]
