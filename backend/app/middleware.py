"""Middlewares et gestionnaires d erreurs communs."""

from fastapi import HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

KB = 1024
MB = 1024 * KB
DEFAULT_MAX_BODY = 64 * KB
UPLOAD_MAX_BODY = 11 * MB  # 10 Mo de PDF + l enveloppe multipart


class BodySizeLimit:
    """Refuse les corps de requete trop gros AVANT qu ils soient lus en entier.

    Sans ca, FastAPI lit tout le JSON en memoire (ou tout le multipart sur
    disque) avant que la validation ou la route ne puisse refuser.
    """

    def __init__(self, app, default_max: int = DEFAULT_MAX_BODY, per_path: dict[str, int] | None = None):
        self.app = app
        self.default_max = default_max
        self.per_path = per_path or {}

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        limite = self.per_path.get(scope["path"], self.default_max)

        for nom, valeur in scope["headers"]:
            if nom == b"content-length":
                try:
                    trop_gros = int(valeur) > limite
                except ValueError:
                    trop_gros = True
                if trop_gros:
                    reponse = JSONResponse({"detail": "Requête trop volumineuse."}, status_code=413)
                    return await reponse(scope, receive, send)

        recu = 0

        async def receive_limite():
            nonlocal recu
            message = await receive()
            if message["type"] == "http.request":
                recu += len(message.get("body", b""))
                if recu > limite:
                    # Cas sans Content-Length (transfert par morceaux).
                    # FastAPI relance ses propres HTTPException levees pendant
                    # la lecture du corps (pas celles de Starlette) : elles
                    # deviennent une vraie reponse 413.
                    raise HTTPException(status_code=413, detail="Requête trop volumineuse.")
            return message

        await self.app(scope, receive_limite, send)


def _nom_du_champ(loc) -> str | None:
    for partie in reversed(loc):
        if isinstance(partie, str) and partie not in ("body", "query", "path", "header"):
            return partie
    return None


def _message(err: dict) -> str:
    champ = _nom_du_champ(err.get("loc", ()))
    ctx = err.get("ctx") or {}
    kind = err.get("type", "")

    if champ is None:
        return "Requête invalide."
    if kind == "missing":
        return f"Le champ « {champ} » est obligatoire."
    if kind == "string_too_long":
        return f"Le champ « {champ} » est trop long ({ctx.get('max_length')} caractères maximum)."
    if kind == "string_too_short":
        if ctx.get("min_length") == 1:
            return f"Le champ « {champ} » est vide."
        return f"Le champ « {champ} » est trop court ({ctx.get('min_length')} caractères minimum)."
    if kind == "too_long":
        return f"Trop d'éléments dans « {champ} » ({ctx.get('max_length')} maximum)."
    if champ == "email":
        return "Adresse email invalide."
    if kind == "value_error":
        return str(err.get("msg", "")).removeprefix("Value error, ") or f"Le champ « {champ} » est invalide."
    return f"Le champ « {champ} » est invalide."


async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """422 avec un `detail` lisible (une phrase), affichable tel quel par le
    frontend et le widget. Les valeurs envoyees ne sont pas renvoyees : elles
    peuvent contenir un mot de passe."""
    erreurs = exc.errors()
    detail = _message(erreurs[0]) if erreurs else "Requête invalide."
    resume = [{"loc": e.get("loc"), "type": e.get("type"), "msg": e.get("msg")} for e in erreurs]
    return JSONResponse(
        status_code=422,
        content={"detail": detail, "errors": jsonable_encoder(resume)},
    )
