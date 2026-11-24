import logging
import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from db.users import get_user_by_id

load_dotenv()
log = logging.getLogger("uvicorn.error")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

SECRET = os.getenv("JWT_SECRET", "")
if not SECRET:
    raise RuntimeError(
        "JWT_SECRET manquant : ajoute-le dans backend/.env ou dans les variables "
        "d'environnement du serveur."
    )
if len(SECRET) < 32:
    log.warning(
        "JWT_SECRET fait moins de 32 caracteres. Genere un secret plus long : "
        "python -c \"import secrets; print(secrets.token_urlsafe(48))\""
    )

ALGORITHM = "HS256"
TOKEN_HOURS = 24
BCRYPT_MAX_BYTES = 72

# Hash bcrypt d une valeur aleatoire jetee (meme cout, 12, que les vrais
# hashes). Au login, quand l email n existe pas, on verifie quand meme contre
# ce hash : le temps de reponse est le meme que pour un vrai compte, et ne
# revele pas si l email est inscrit. Pre-calcule pour ne pas ajouter ~0,4 s
# a chaque demarrage du serveur.
_DUMMY_HASH = "$2b$12$irfZJMtmk4UxENpAWMuLlu/oIvJ3EbPlqkfCiUUQiqnpXewHnBque"


def hash_password(password: str) -> str:
    """Transforme un password en hash bcrypt.

    La longueur (72 octets max) est verifiee a l inscription : ici on refuse
    plutot que de tronquer en silence.
    """
    pwd = password.encode("utf-8")
    if len(pwd) > BCRYPT_MAX_BYTES:
        raise ValueError("Mot de passe trop long pour bcrypt (72 octets max).")
    return bcrypt.hashpw(pwd, bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verifie qu un password correspond a un hash.

    La troncature a 72 octets est gardee uniquement pour les comptes crees
    avant la limite de longueur : leur hash a ete calcule sur ces 72 octets.
    """
    pwd = password.encode("utf-8")[:BCRYPT_MAX_BYTES]
    return bcrypt.checkpw(pwd, hashed.encode("utf-8"))


def burn_password_check(password: str) -> None:
    """Fait le meme travail qu une vraie verification, pour un email inconnu."""
    verify_password(password, _DUMMY_HASH)


def create_token(user_id: int) -> str:
    """Cree un JWT signe contenant l id utilisateur."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(hours=TOKEN_HOURS),
    }
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> int | None:
    """Retourne l user_id si le token est valide, None sinon."""
    try:
        payload = jwt.decode(
            token,
            SECRET,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
        return int(payload["sub"])
    except (jwt.PyJWTError, ValueError):
        return None


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
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
