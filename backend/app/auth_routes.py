from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, EmailStr, Field, field_validator

from app.limiter import limiter
from app.login_guard import login_guard
from app.passwords import MAX_CHARS, password_problem
from app.security import burn_password_check, create_token, hash_password, verify_password
from db.users import create_user, get_user_by_email

router = APIRouter(prefix="/auth", tags=["auth"])


class Credentials(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=MAX_CHARS)

    @field_validator("email")
    @classmethod
    def normaliser_email(cls, v: str) -> str:
        """Zaki@x.com et zaki@x.com designent le meme compte."""
        return v.strip().lower()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/register", response_model=TokenResponse)
@limiter.limit("5/hour")
def register(request: Request, body: Credentials):
    probleme = password_problem(body.password, body.email)
    if probleme:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=probleme)

    user_id = create_user(body.email, hash_password(body.password))
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cet email est deja utilise.",
        )

    return TokenResponse(access_token=create_token(user_id))


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(request: Request, body: Credentials):
    attente = login_guard.retry_after(body.email)
    if attente:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Trop de tentatives sur ce compte. Réessayez dans quelques minutes.",
            headers={"Retry-After": str(attente)},
        )

    user = get_user_by_email(body.email)
    if user is None:
        burn_password_check(body.password)
        valide = False
    else:
        valide = verify_password(body.password, user["password"])

    if not valide:
        login_guard.echec(body.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect.",
        )

    login_guard.succes(body.email)
    return TokenResponse(access_token=create_token(user["id"]))
