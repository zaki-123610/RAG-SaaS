import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Request
from pydantic import BaseModel

from app.security import get_current_user
from db.bots import add_chunks, create_bot, list_bots, user_owns_bot
from rag.generation import answer
from rag.store import index_document

from rag.store import index_document, list_documents

from app.limiter import limiter

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_UPLOAD_MB = 10
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024

class QueryRequest(BaseModel):
    bot_id: str
    question: str


class BotRequest(BaseModel):
    name: str


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
async def me(user: dict = Depends(get_current_user)) -> dict:
    return user


@router.post("/bots")
async def new_bot(body: BotRequest, user: dict = Depends(get_current_user)) -> dict:
    bot_id = create_bot(user["id"], body.name)
    return {"id": bot_id, "name": body.name, "chunks": 0}


@router.get("/bots")
async def my_bots(user: dict = Depends(get_current_user)) -> list[dict]:
    return list_bots(user["id"])


@router.post("/upload")
@limiter.limit("10/hour")
async def upload(
    request: Request,
    bot_id: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
) -> dict:
    check_owner(user["id"], bot_id)

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
                taille += len(morceau)
                if taille > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail=f"Fichier trop volumineux (max {MAX_UPLOAD_MB} Mo).",
                    )
                f.write(morceau)

        try:
            n = index_document(str(chemin), bot_id, file.filename or "document.pdf")
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF invalide ou illisible.",
            )
    finally:
        chemin.unlink(missing_ok=True)

    add_chunks(bot_id, n)
    return {"bot_id": bot_id, "chunks": n}


@router.get("/bots/{bot_id}/documents")
async def bot_documents(bot_id: str, user: dict = Depends(get_current_user)) -> list[dict]:
    check_owner(user["id"], bot_id)
    return list_documents(bot_id)

@router.post("/query")
@limiter.limit("30/minute")
async def query(request: Request, body: QueryRequest, user: dict = Depends(get_current_user)) -> dict:
    check_owner(user["id"], body.bot_id)
    return {"answer": answer(body.question, body.bot_id)}