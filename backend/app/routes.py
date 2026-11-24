"""Routes privees (JWT).

Les routes sont en `def` et non `async def` : elles appellent du code
bloquant (Postgres, Jina, Groq, pypdf). FastAPI les execute alors dans un
pool de threads, au lieu de geler toute l API pendant chaque appel.
"""

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from pydantic import BaseModel, Field, field_validator

from app.limiter import limiter
from app.schemas import MAX_ORIGINS, BotId, BotName, Question, normaliser_origine
from app.security import get_current_user
from db.bots import (
    MAX_BOTS_PER_USER,
    count_bots,
    create_bot,
    delete_bot,
    list_bots,
    set_public,
    user_owns_bot,
)
from db.users import get_usage
from rag.chunking import PdfTropLong, split_pdf
from rag.generation import answer
from rag.store import delete_document, index_chunks, list_documents

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_UPLOAD_MB = 10
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
MAX_FILENAME_CHARS = 200


class QueryRequest(BaseModel):
    bot_id: BotId
    question: Question


class BotRequest(BaseModel):
    name: BotName


class PublishRequest(BaseModel):
    is_public: bool
    allowed_origins: list[str] = Field(default_factory=list, max_length=MAX_ORIGINS)

    @field_validator("allowed_origins")
    @classmethod
    def valider_origines(cls, origines: list[str]) -> list[str]:
        propres: list[str] = []
        for origine in origines:
            normalisee = normaliser_origine(origine)
            if normalisee not in propres:
                propres.append(normalisee)
        return propres


def check_owner(user_id: int, bot_id: str) -> None:
    """Leve 403 si le bot n appartient pas a l utilisateur."""
    if not user_owns_bot(user_id, bot_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce bot n'existe pas ou ne vous appartient pas.",
        )


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/me")
def me(user: dict = Depends(get_current_user)) -> dict:
    return user


@router.post("/bots")
@limiter.limit("30/hour")
def new_bot(request: Request, body: BotRequest, user: dict = Depends(get_current_user)) -> dict:
    if count_bots(user["id"]) >= MAX_BOTS_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Limite de {MAX_BOTS_PER_USER} chatbots atteinte. Supprimez-en un pour en créer un nouveau.",
        )
    bot_id = create_bot(user["id"], body.name)
    return {"id": bot_id, "name": body.name, "chunks": 0}


@router.get("/bots")
def my_bots(user: dict = Depends(get_current_user)) -> list[dict]:
    return list_bots(user["id"])


@router.post("/upload")
@limiter.limit("10/hour")
def upload(
    request: Request,
    bot_id: str = Form(..., min_length=1, max_length=32),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
) -> dict:
    check_owner(user["id"], bot_id)

    usage = get_usage(user["id"])
    restant = usage["limit"] - usage["used"]
    if restant <= 0:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Quota atteint ({usage['used']}/{usage['limit']} morceaux). Supprimez des documents pour continuer.",
        )
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seuls les fichiers PDF sont acceptes.",
        )

    chemin = UPLOAD_DIR / f"{uuid.uuid4()}.pdf"
    taille = 0

    try:
        with chemin.open("wb") as f:
            while morceau := file.file.read(1024 * 1024):
                # Le content-type vient du client : on verifie la signature
                # du fichier (%PDF- dans le premier Ko, comme les lecteurs PDF).
                if taille == 0 and b"%PDF-" not in morceau[:1024]:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Ce fichier n'est pas un PDF valide.",
                    )
                taille += len(morceau)
                if taille > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail=f"Fichier trop volumineux (max {MAX_UPLOAD_MB} Mo).",
                    )
                f.write(morceau)

        try:
            chunks = split_pdf(str(chemin))
        except PdfTropLong as e:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF invalide ou illisible.",
            )
    finally:
        chemin.unlink(missing_ok=True)

    # Le quota est verifie APRES le decoupage et AVANT l embedding (payant) :
    # un seul gros PDF ne peut plus depasser la limite.
    if len(chunks) > restant:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                f"Ce document donne {len(chunks)} morceaux, il vous en reste {restant} "
                f"sur {usage['limit']}. Supprimez des documents ou envoyez un fichier plus court."
            ),
        )

    filename = (file.filename or "document.pdf")[:MAX_FILENAME_CHARS]
    try:
        n = index_chunks(chunks, bot_id, filename)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="L'indexation a echoue, reessayez dans quelques instants.",
        )

    return {"bot_id": bot_id, "chunks": n}


@router.get("/bots/{bot_id}/documents")
def bot_documents(bot_id: str, user: dict = Depends(get_current_user)) -> list[dict]:
    check_owner(user["id"], bot_id)
    return list_documents(bot_id)


@router.delete("/bots/{bot_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_bot(bot_id: str, user: dict = Depends(get_current_user)):
    if not delete_bot(user["id"], bot_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ce bot n'existe pas ou ne vous appartient pas.",
        )


@router.delete("/bots/{bot_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_document(
    bot_id: str,
    document_id: int,
    user: dict = Depends(get_current_user),
):
    check_owner(user["id"], bot_id)
    if not delete_document(bot_id, document_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document introuvable.",
        )


@router.patch("/bots/{bot_id}/publish")
def publish_bot(
    bot_id: str,
    body: PublishRequest,
    user: dict = Depends(get_current_user),
) -> dict:
    if not set_public(user["id"], bot_id, body.is_public, body.allowed_origins):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ce bot n'existe pas ou ne vous appartient pas.",
        )
    return {"bot_id": bot_id, "is_public": body.is_public, "allowed_origins": body.allowed_origins}


@router.get("/usage")
def usage(user: dict = Depends(get_current_user)) -> dict:
    return get_usage(user["id"])


@router.post("/query")
@limiter.limit("30/minute")
def query(request: Request, body: QueryRequest, user: dict = Depends(get_current_user)) -> dict:
    check_owner(user["id"], body.bot_id)
    return {"answer": answer(body.question, body.bot_id)}
