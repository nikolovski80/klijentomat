from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
from app.core.database import get_db
from app.models import EmailLog, Lead, LeadStatus
import base64

router = APIRouter()

# 1x1 transparent PNG piksel
PIXEL = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
)


@router.get("/open/{token}")
async def track_open(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EmailLog).where(EmailLog.tracking_token == token))
    log = result.scalar_one_or_none()
    if log:
        log.open_count += 1
        if not log.opened_at:
            log.opened_at = datetime.utcnow()
            # Ažuriraj status lead-a
            await db.execute(
                update(Lead).where(Lead.id == log.lead_id).values(status=LeadStatus.opened)
            )
        await db.commit()
    return Response(content=PIXEL, media_type="image/png")


@router.get("/click/{token}")
async def track_click(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EmailLog).where(EmailLog.tracking_token == token))
    log = result.scalar_one_or_none()
    if log and not log.clicked_at:
        log.clicked_at = datetime.utcnow()
        await db.commit()
    # S3-07: redirect na pravi URL (čuvati URL u EmailLog)
    return {"status": "clicked"}


@router.get("/unsubscribe/{token}")
async def unsubscribe(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EmailLog).where(EmailLog.tracking_token == token))
    log = result.scalar_one_or_none()
    if log:
        await db.execute(
            update(Lead).where(Lead.id == log.lead_id).values(is_unsubscribed=True)
        )
        await db.commit()
    return {"message": "Uspešno ste se odjavili."}
