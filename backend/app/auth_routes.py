from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.security import hash_password, verify_password, create_token
from db.users import create_user, get_user_by_email

router = APIRouter(prefix="/auth", tags=["auth"])


class Credentials(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/register", response_model=TokenResponse)
async def register(body: Credentials):
    if len(body.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mot de passe doit faire au moins 8 caracteres.",
        )

    user_id = create_user(body.email, hash_password(body.password))
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cet email est deja utilise.",
        )

    return TokenResponse(access_token=create_token(user_id))


@router.post("/login", response_model=TokenResponse)
async def login(body: Credentials):
    user = get_user_by_email(body.email)

    if not user or not verify_password(body.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
        )

    return TokenResponse(access_token=create_token(user["id"]))