import os
from datetime import datetime, timedelta, timezone

import bcrypt
from dotenv import load_dotenv
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from db.users import get_user_by_id

load_dotenv()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

SECRET = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"
TOKEN_HOURS = 24


def hash_password(password: str) -> str:
    """Transforme un password en hash bcrypt."""
    pwd = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verifie qu un password correspond a un hash."""
    pwd = password.encode("utf-8")[:72]
    return bcrypt.checkpw(pwd, hashed.encode("utf-8"))


def create_token(user_id: int) -> str:
    """Cree un JWT signe contenant l id utilisateur."""
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_HOURS),
    }
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> int | None:
    """Retourne l user_id si le token est valide, None sinon."""
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        return None


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Lit le token, retourne le user. Leve 401 si invalide."""
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token invalide ou expire.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    user_id = decode_token(token)
    if user_id is None:
        raise credentials_error

    user = get_user_by_id(user_id)
    if user is None:
        raise credentials_error

    return user