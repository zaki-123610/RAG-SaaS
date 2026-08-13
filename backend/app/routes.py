import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile
from pydantic import BaseModel

from rag.store import index_document
from rag.generation import answer

from fastapi import Depends
from app.security import get_current_user

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


class QueryRequest(BaseModel):
    bot_id: str
    question: str


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

@router.get("/me")
async def me(user: dict = Depends(get_current_user)) -> dict:
    return user

@router.post("/upload")
async def upload(bot_id: str = Form(...), file: UploadFile = File(...)) -> dict:
    chemin = UPLOAD_DIR / f"{uuid.uuid4()}.pdf"
    with chemin.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    n = index_document(str(chemin), bot_id)
    chemin.unlink()

    return {"bot_id": bot_id, "chunks": n}


@router.post("/query")
async def query(body: QueryRequest) -> dict:
    return {"answer": answer(body.question, body.bot_id)}