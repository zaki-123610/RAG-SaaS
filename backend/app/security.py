import os
from datetime import datetime, timedelta, timezone

import bcrypt
from dotenv import load_dotenv
from jose import JWTError, jwt

load_dotenv()

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