import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_tenant
from app.models import Tenant
from app.schemas.knowledge import (
    KnowledgeAllOut,
    KnowledgeCategoryOut,
    KnowledgeCategoryUpsert,
    KnowledgeItemOut,
)
from app.services import knowledge as knowledge_svc

router = APIRouter()


@router.get("/", response_model=KnowledgeAllOut)
async def get_all_knowledge(
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Sve stavke baze znanja, grupisane po kategoriji."""
    grouped = await knowledge_svc.get_all(db, tenant.id)
    categories = {
        cat: [KnowledgeItemOut.model_validate(item) for item in items]
        for cat, items in grouped.items()
    }
    return KnowledgeAllOut(categories=categories)


@router.get("/{category}", response_model=KnowledgeCategoryOut)
async def get_category(
    category: str,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Stavke jedne kategorije (firma, cenovnik, branding, faq...)."""
    items = await knowledge_svc.get_by_category(db, tenant.id, category)
    return KnowledgeCategoryOut(
        category=category,
        items=[KnowledgeItemOut.model_validate(i) for i in items],
    )


@router.put("/{category}", response_model=KnowledgeCategoryOut)
async def upsert_category(
    category: str,
    body: KnowledgeCategoryUpsert,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Snimi sve stavke kategorije odjednom (upsert po ključu, briše stare)."""
    if not category.replace("-", "").replace("_", "").isalnum():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Naziv kategorije može sadržati samo slova, brojeve, - i _",
        )
    saved = await knowledge_svc.upsert_category(
        db,
        tenant.id,
        category,
        [{"key": i.key, "value": i.value} for i in body.items],
    )
    return KnowledgeCategoryOut(
        category=category,
        items=[KnowledgeItemOut.model_validate(i) for i in saved],
    )


@router.delete("/item/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    """Obriši jednu stavku."""
    deleted = await knowledge_svc.delete_item(db, tenant.id, item_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Stavka nije pronađena")
