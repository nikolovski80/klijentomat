# Importuj sve modele u tačno ovom redosledu da bi SQLAlchemy
# registry i relationships bili ispravno registrovani.
# NIKAD ne importuj direktno iz app.models.__init__ — koristi app.models

from app.models.tenant import Tenant, PlanType
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus
from app.models.campaign import Campaign, CampaignStatus
from app.models.email_log import EmailLog
from app.models.knowledge import KnowledgeItem
from app.models.review import Review

__all__ = [
    "Tenant", "PlanType",
    "User", "UserRole",
    "Lead", "LeadStatus",
    "Campaign", "CampaignStatus",
    "EmailLog",
    "KnowledgeItem",
    "Review",
]
