"""Blocage temporaire d un compte apres trop d echecs de connexion.

Complete le rate limiting par IP : un attaquant qui change d IP a chaque
essai reste bloque, car le compteur est lie a l email vise.

Stockage en memoire : suffisant pour un seul process uvicorn. Avec plusieurs
workers ou instances, il faudrait un stockage partage (Redis, Postgres).
"""

import threading
import time
from collections import OrderedDict

MAX_ECHECS = 5
FENETRE_SECONDES = 15 * 60
MAX_ENTREES = 10_000  # borne la memoire si quelqu un essaie des milliers d emails


class LoginGuard:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._echecs: OrderedDict[str, list[float]] = OrderedDict()

    def _recents(self, email: str, now: float) -> list[float]:
        return [t for t in self._echecs.get(email, []) if now - t < FENETRE_SECONDES]

    def retry_after(self, email: str) -> int:
        """Secondes a attendre si le compte est bloque, 0 sinon."""
        now = time.monotonic()
        with self._lock:
            recents = self._recents(email, now)
            if len(recents) < MAX_ECHECS:
                return 0
            return int(FENETRE_SECONDES - (now - recents[-MAX_ECHECS])) + 1

    def echec(self, email: str) -> None:
        now = time.monotonic()
        with self._lock:
            recents = self._recents(email, now)
            recents.append(now)
            self._echecs[email] = recents
            self._echecs.move_to_end(email)
            while len(self._echecs) > MAX_ENTREES:
                self._echecs.popitem(last=False)

    def succes(self, email: str) -> None:
        with self._lock:
            self._echecs.pop(email, None)

    def reset(self) -> None:
        with self._lock:
            self._echecs.clear()


login_guard = LoginGuard()
