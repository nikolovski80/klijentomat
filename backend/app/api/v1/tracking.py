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
    from fastapi.responses import RedirectResponse
    from sqlalchemy import select as sa_select
    result = await db.execute(sa_select(EmailLog).where(EmailLog.tracking_token == token))
    log = result.scalar_one_or_none()

    redirect_url = "/"
    if log:
        if not log.clicked_at:
            log.clicked_at = datetime.utcnow()

        # Dohvati website lead-a kao redirect URL
        lead_result = await db.execute(sa_select(Lead).where(Lead.id == log.lead_id))
        lead = lead_result.scalar_one_or_none()
        if lead and lead.website:
            redirect_url = lead.website

        await db.commit()

    return RedirectResponse(url=redirect_url, status_code=302)


@router.get("/unsubscribe/{token}")
async def unsubscribe(token: str, db: AsyncSession = Depends(get_db)):
    from fastapi.responses import HTMLResponse
    result = await db.execute(select(EmailLog).where(EmailLog.tracking_token == token))
    log = result.scalar_one_or_none()
    if log:
        await db.execute(
            update(Lead).where(Lead.id == log.lead_id).values(is_unsubscribed=True)
        )
        await db.commit()
    html = """
    <!DOCTYPE html>
    <html lang="sr">
    <head><meta charset="UTF-8"><title>Odjava</title></head>
    <body style="font-family:sans-serif;text-align:center;padding:60px;background:#f8f9fa;">
      <h2 style="color:#333;">Uspešno ste se odjavili</h2>
      <p style="color:#666;">Nećete više primati naše email poruke.</p>
    </body>
    </html>
    """
    return HTMLResponse(content=html, status_code=200)
