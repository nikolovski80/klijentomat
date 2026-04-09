from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "klijentomat",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.scraping",
        "app.tasks.email_send",
        "app.tasks.followup",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Europe/Belgrade",
    enable_utc=True,
    beat_schedule={
        # S3-09: Svaki sat proverava followup-e
        "check-followups": {
            "task": "app.tasks.followup.check_followups",
            "schedule": 3600.0,
        },
    },
)
