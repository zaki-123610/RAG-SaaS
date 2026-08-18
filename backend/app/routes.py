import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Request
from pydantic import BaseModel

from app.security import get_current_user
from db.bots import create_bot, list_bots, user_owns_bot
from rag.generation import answer
from rag.store import index_document

from rag.store import index_document, list_documents

from app.limiter import limiter

from db.bots import create_bot, delete_bot, list_bots, user_owns_bot
from rag.store import delete_document, index_document, list_documents

from fastapi import Header
from db.bots import count_queries_today, get_public_bot, log_query, set_public

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

class PublicQueryRequest(BaseModel):
    bot_id: str
    question: str


class PublishRequest(BaseModel):
    is_public: bool
    allowed_origins: list[str] = []


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

    
    return {"bot_id": bot_id, "chunks": n}


@router.get("/bots/{bot_id}/documents")
async def bot_documents(bot_id: str, user: dict = Depends(get_current_user)) -> list[dict]:
    check_owner(user["id"], bot_id)
    return list_documents(bot_id)


@router.delete("/bots/{bot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_bot(bot_id: str, user: dict = Depends(get_current_user)):
    if not delete_bot(user["id"], bot_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ce bot n'existe pas ou ne vous appartient pas.",
        )


@router.delete("/bots/{bot_id}/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_document(
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



@router.post("/public/query")
@limiter.limit("20/minute")
async def public_query(
    request: Request,
    body: PublicQueryRequest,
    origin: str | None = Header(default=None),
) -> dict:
    bot = get_public_bot(body.bot_id)
    if bot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot introuvable ou non publie.",
        )

    if bot["allowed_origins"] and origin not in bot["allowed_origins"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce domaine n'est pas autorise.",
        )

    if count_queries_today(body.bot_id) >= bot["daily_limit"]:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Quota quotidien atteint pour ce chatbot.",
        )

    question = body.question.strip()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La question est vide.",
        )

    log_query(body.bot_id, question)
    return {"answer": answer(question, body.bot_id)}

@router.patch("/bots/{bot_id}/publish")
async def publish_bot(
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

@router.post("/query")
@limiter.limit("30/minute")
async def query(request: Request, body: QueryRequest, user: dict = Depends(get_current_user)) -> dict:
    check_owner(user["id"], body.bot_id)
    return {"answer": answer(body.question, body.bot_id)}