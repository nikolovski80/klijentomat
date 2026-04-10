"""
S3-04: Celery task za slanje kampanje emailova.
"""
import asyncio
import time
import uuid
from datetime import datetime

from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.email_send.send_campaign", bind=True)
def send_campaign(self, campaign_id: str, tenant_id: str):
    """Pošalji kampanju svim leadovima tenanta koji nisu unsubscribed."""
    asyncio.run(_async_send_campaign(campaign_id, tenant_id))


async def _async_send_campaign(campaign_id_str: str, tenant_id_str: str):
    from app.core.database import AsyncSessionLocal
    from app.models import Campaign, CampaignStatus, Lead, EmailLog
    from app.services.mailer import send_email
    from sqlalchemy import select, and_

    campaign_id = uuid.UUID(campaign_id_str)
    tenant_id = uuid.UUID(tenant_id_str)

    async with AsyncSessionLocal() as db:
        # Učitaj kampanju
        result = await db.execute(
            select(Campaign).where(
                and_(Campaign.id == campaign_id, Campaign.tenant_id == tenant_id)
            )
        )
        campaign = result.scalar_one_or_none()
        if not campaign:
            return

        # Označi kao active
        campaign.status = CampaignStatus.active
        await db.flush()

        # Dohvati sve leadove koji nisu unsubscribed i imaju email
        leads_result = await db.execute(
            select(Lead).where(
                and_(
                    Lead.tenant_id == tenant_id,
                    Lead.is_unsubscribed == False,
                    Lead.email.isnot(None),
                )
            )
        )
        leads = list(leads_result.scalars().all())

        for lead in leads:
            tracking_token = uuid.uuid4().hex

            # Kreiraj EmailLog
            log = EmailLog(
                tenant_id=tenant_id,
                lead_id=lead.id,
                campaign_id=campaign_id,
                tracking_token=tracking_token,
                is_followup=False,
            )
            db.add(log)
            await db.flush()

            # Pošalji email
            sent = await send_email(
                to_email=lead.email,
                to_name=lead.company_name,
                from_email=campaign.from_email,
                from_name=campaign.from_name,
                subject=campaign.subject,
                html_body=campaign.body_html,
                tracking_token=tracking_token,
            )

            if sent:
                log.sent_at = datetime.utcnow()

            await db.flush()
            time.sleep(0.1)  # Rate limit — 10 mejlova/s max

        campaign.status = CampaignStatus.finished
        campaign.sent_at = datetime.utcnow()
        await db.commit()
