"""Rate limiting par IP.

Derriere un reverse proxy (Render), request.client.host est l IP du proxy,
la meme pour tous les visiteurs : les limites deviennent alors globales.
TRUSTED_PROXY_HOPS indique combien de proxys de confiance ajoutent une
entree a X-Forwarded-For devant l app.

Pour trouver la bonne valeur : mettre LOG_CLIENT_IP=1, faire une requete de
login en prod, lire les logs, puis retirer LOG_CLIENT_IP.
"""

import logging
import os

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

log = logging.getLogger("uvicorn.error")

TRUSTED_PROXY_HOPS = int(os.getenv("TRUSTED_PROXY_HOPS", "0"))
LOG_CLIENT_IP = os.getenv("LOG_CLIENT_IP") == "1"


def client_ip(request: Request) -> str:
    """IP du visiteur, en ne faisant confiance qu aux proxys configures."""
    direct = get_remote_address(request)
    forwarded = request.headers.get("x-forwarded-for", "")

    if LOG_CLIENT_IP:
        log.info("client_ip: client.host=%s x-forwarded-for=%s", direct, forwarded)

    if TRUSTED_PROXY_HOPS <= 0 or not forwarded:
        return direct

    ips = [ip.strip() for ip in forwarded.split(",") if ip.strip()]
    if len(ips) < TRUSTED_PROXY_HOPS:
        return direct

    # Chaque proxy ajoute a DROITE l IP qui l a contacte. Les entrees de
    # gauche peuvent etre inventees par le client : on prend celle ajoutee
    # par le proxy de confiance le plus eloigne de l app.
    return ips[-TRUSTED_PROXY_HOPS]


limiter = Limiter(key_func=client_ip)
