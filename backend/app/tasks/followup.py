"""
S3-05/S3-09: Celery beat task za automatski followup.
Pokreće se svakog sata (konfigurisano u celery_app.py).
"""
import asyncio
import uuid
import time
from datetime import datetime, timedelta

from app.tasks.celery_app import celery_app


@celery_app.task(name="app.tasks.followup.check_followups")
def check_followups():
    """
    Pronalazi kampanje sa followup_subject != None i followup_days > 0.
    Šalje followup emailove leadovima koji:
    - su primili originalni email pre followup_days dana
    - nisu otvorili email
    - nisu unsubscribed
    - nisu već dobili followup
    """
    asyncio.run(_async_check_followups())


async def _async_check_followups():
    from app.core.database import AsyncSessionLocal
    from app.models import Campaign, CampaignStatus, Lead, EmailLog
    from app.services.mailer import send_email
    from sqlalchemy import select, and_

    async with AsyncSessionLocal() as db:
        # Pronađi aktivne/završene kampanje sa followup podešavanjima
        campaigns_result = await db.execute(
            select(Campaign).where(
                and_(
                    Campaign.followup_subject.isnot(None),
                    Campaign.followup_days > 0,
                    Campaign.status.in_([CampaignStatus.active, CampaignStatus.finished]),
                )
            )
        )
        campaigns = list(campaigns_result.scalars().all())

        for campaign in campaigns:
            cutoff = datetime.utcnow() - timedelta(days=campaign.followup_days)

            # Pronađi email logove koji ispunjavaju uslove za followup
            logs_result = await db.execute(
                select(EmailLog).where(
                    and_(
                        EmailLog.campaign_id == campaign.id,
                        EmailLog.is_followup == False,
                        EmailLog.sent_at.isnot(None),
                        EmailLog.sent_at <= cutoff,
                        EmailLog.opened_at.is_(None),  # Nije otvorio
                    )
                )
            )
            original_logs = list(logs_result.scalars().all())

            for original_log in original_logs:
                # Proveri da li je followup već poslat
                followup_check = await db.execute(
                    select(EmailLog).where(
                        and_(
                            EmailLog.lead_id == original_log.lead_id,
                            EmailLog.campaign_id == campaign.id,
                            EmailLog.is_followup == True,
                        )
                    )
                )
                if followup_check.scalar_one_or_none():
                    continue

                # Dohvati lead
                lead_result = await db.execute(
                    select(Lead).where(
                        and_(
                            Lead.id == original_log.lead_id,
                            Lead.is_unsubscribed == False,
                            Lead.email.isnot(None),
                        )
                    )
                )
                lead = lead_result.scalar_one_or_none()
                if not lead:
                    continue

                tracking_token = uuid.uuid4().hex

                # Kreiraj followup EmailLog
                followup_log = EmailLog(
                    tenant_id=campaign.tenant_id,
                    lead_id=lead.id,
                    campaign_id=campaign.id,
                    tracking_token=tracking_token,
                    is_followup=True,
                )
                db.add(followup_log)
                await db.flush()

                # Pošalji followup email
                sent = await send_email(
                    to_email=lead.email,
                    to_name=lead.company_name,
                    from_email=campaign.from_email,
                    from_name=campaign.from_name,
                    subject=campaign.followup_subject,
                    html_body=campaign.followup_html or campaign.body_html,
                    tracking_token=tracking_token,
                )

                if sent:
                    followup_log.sent_at = datetime.utcnow()

                await db.flush()
                time.sleep(0.1)  # Rate limit

        await db.commit()
