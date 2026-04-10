from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr
import uuid

from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_current_user
from app.models import Tenant, User, PlanType

router = APIRouter()


class RegisterRequest(BaseModel):
    company_name: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/register", response_model=TokenResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Proveri da li postoji
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email vec postoji")

    # Kreiraj tenant
    slug = data.company_name.lower().replace(" ", "-")[:50] + "-" + str(uuid.uuid4())[:8]
    tenant = Tenant(name=data.company_name, slug=slug, plan=PlanType.tehnicar)
    db.add(tenant)
    await db.flush()

    # Kreiraj usera
    user = User(
        tenant_id=tenant.id,
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.company_name,
    )
    db.add(user)
    await db.flush()

    token = create_access_token({"sub": str(user.id), "tenant_id": str(tenant.id)})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Pogresni kredencijali")

    token = create_access_token({"sub": str(user.id), "tenant_id": str(user.tenant_id)})
    return TokenResponse(access_token=token)


@router.get("/me")
async def me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "tenant_id": str(current_user.tenant_id),
        "role": current_user.role,
    }
