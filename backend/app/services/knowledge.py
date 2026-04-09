import uuid
from collections import defaultdict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models import KnowledgeItem


async def get_all(db: AsyncSession, tenant_id: uuid.UUID) -> dict[str, list[KnowledgeItem]]:
    result = await db.execute(
        select(KnowledgeItem)
        .where(KnowledgeItem.tenant_id == tenant_id)
        .order_by(KnowledgeItem.category, KnowledgeItem.key)
    )
    items = result.scalars().all()
    grouped: dict[str, list[KnowledgeItem]] = defaultdict(list)
    for item in items:
        grouped[item.category].append(item)
    return dict(grouped)


async def get_by_category(
    db: AsyncSession, tenant_id: uuid.UUID, category: str
) -> list[KnowledgeItem]:
    result = await db.execute(
        select(KnowledgeItem)
        .where(
            KnowledgeItem.tenant_id == tenant_id,
            KnowledgeItem.category == category,
        )
        .order_by(KnowledgeItem.key)
    )
    return list(result.scalars().all())


async def upsert_category(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    category: str,
    items: list[dict],  # [{"key": ..., "value": ...}]
) -> list[KnowledgeItem]:
    """Zameni sve stavke u kategoriji novim listom (upsert po ključu)."""
    # Učitaj postojeće
    existing_result = await db.execute(
        select(KnowledgeItem).where(
            KnowledgeItem.tenant_id == tenant_id,
            KnowledgeItem.category == category,
        )
    )
    existing = {item.key: item for item in existing_result.scalars().all()}

    incoming_keys = {i["key"] for i in items}

    # Obriši stavke koje više ne postoje
    keys_to_delete = set(existing.keys()) - incoming_keys
    if keys_to_delete:
        await db.execute(
            delete(KnowledgeItem).where(
                KnowledgeItem.tenant_id == tenant_id,
                KnowledgeItem.category == category,
                KnowledgeItem.key.in_(keys_to_delete),
            )
        )

    # Upsert po ključu
    saved: list[KnowledgeItem] = []
    for item_data in items:
        key = item_data["key"]
        value = item_data["value"]
        if key in existing:
            existing[key].value = value
            saved.append(existing[key])
        else:
            new_item = KnowledgeItem(
                tenant_id=tenant_id,
                category=category,
                key=key,
                value=value,
            )
            db.add(new_item)
            saved.append(new_item)

    await db.flush()
    return saved


async def delete_item(
    db: AsyncSession, tenant_id: uuid.UUID, item_id: uuid.UUID
) -> bool:
    result = await db.execute(
        select(KnowledgeItem).where(
            KnowledgeItem.id == item_id,
            KnowledgeItem.tenant_id == tenant_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        return False
    await db.delete(item)
    await db.flush()
    return True
