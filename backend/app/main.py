from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, leads, campaigns, knowledge, tracking, reviews

app = FastAPI(
    title="Klijentomat API",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(leads.router, prefix="/api/v1/leads", tags=["leads"])
app.include_router(campaigns.router, prefix="/api/v1/campaigns", tags=["campaigns"])
app.include_router(knowledge.router, prefix="/api/v1/knowledge", tags=["knowledge"])
app.include_router(tracking.router, prefix="/api/v1/track", tags=["tracking"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["reviews"])


@app.get("/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}
