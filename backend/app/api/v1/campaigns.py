from fastapi import APIRouter, Depends
from app.core.deps import get_current_tenant
from app.models import Tenant

router = APIRouter()


@router.get("/")
async def list_campaigns(tenant: Tenant = Depends(get_current_tenant)):
    # S3-04: implementirati
    return {"campaigns": []}


@router.post("/ai-write")
async def ai_write(tenant: Tenant = Depends(get_current_tenant)):
    # S3-03: OpenAI GPT pisanje mejla
    return {"html": "TODO: GPT generisanje"}
