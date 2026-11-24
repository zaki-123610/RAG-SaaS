"""Types et limites partages par les routes privees et publiques."""

from typing import Annotated
from urllib.parse import urlsplit

from pydantic import StringConstraints

MAX_QUESTION_CHARS = 1000
MAX_BOT_NAME_CHARS = 80
MAX_ORIGINS = 5
MAX_ORIGIN_CHARS = 200

# Les ids de bots font 12 caracteres hexa ; 32 laisse de la marge.
BotId = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=32)]
Question = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=MAX_QUESTION_CHARS)
]
BotName = Annotated[
    str, StringConstraints(strip_whitespace=True, min_length=1, max_length=MAX_BOT_NAME_CHARS)
]

_PORTS_PAR_DEFAUT = {"http": 80, "https": 443}


def normaliser_origine(valeur: str) -> str:
    """Ramene une origine a la forme envoyee par les navigateurs dans le header
    Origin (schema://hote[:port], sans slash final). Leve ValueError sinon."""
    brut = valeur.strip()
    if len(brut) > MAX_ORIGIN_CHARS:
        raise ValueError("Origine trop longue.")

    parts = urlsplit(brut)
    if parts.scheme not in _PORTS_PAR_DEFAUT or not parts.hostname:
        raise ValueError(f"Origine invalide : {brut}. Format attendu : https://mon-site.com")
    if parts.path not in ("", "/") or parts.query or parts.fragment or parts.username or parts.password:
        raise ValueError(f"Origine invalide : {brut}. Indiquez seulement le domaine, sans chemin.")

    hote = parts.hostname
    if ":" in hote:  # IPv6
        hote = f"[{hote}]"
    port = parts.port  # leve ValueError si le port est invalide
    suffixe = f":{port}" if port and port != _PORTS_PAR_DEFAUT[parts.scheme] else ""
    return f"{parts.scheme}://{hote}{suffixe}"
