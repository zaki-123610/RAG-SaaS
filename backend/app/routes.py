import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.security import get_current_user
from db.bots import add_chunks, create_bot, list_bots, user_owns_bot
from rag.generation import answer
from rag.store import index_document

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


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
async def upload(
    bot_id: str = Form(...),
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
) -> dict:
    check_owner(user["id"], bot_id)

    chemin = UPLOAD_DIR / f"{uuid.uuid4()}.pdf"
    with chemin.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        n = index_document(str(chemin), bot_id)
    finally:
        chemin.unlink(missing_ok=True)

    add_chunks(bot_id, n)
    return {"bot_id": bot_id, "chunks": n}


@router.post("/query")
async def query(body: QueryRequest, user: dict = Depends(get_current_user)) -> dict:
    check_owner(user["id"], body.bot_id)
    return {"answer": answer(body.question, body.bot_id)}