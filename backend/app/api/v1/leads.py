from fastapi import APIRouter, Depends
from app.core.deps import get_current_tenant, get_current_user
from app.models.__init__ import Tenant

router = APIRouter()


@router.get("/")
async def list_leads(tenant: Tenant = Depends(get_current_tenant)):
    # S2-03: implementirati sa filterima, paginacijom
    return {"leads": [], "tenant": tenant.slug}


@router.post("/scrape")
async def scrape_leads(tenant: Tenant = Depends(get_current_tenant)):
    # S2-01/S2-02: Google Places API + Celery task
    return {"job_id": "todo", "status": "queued"}
