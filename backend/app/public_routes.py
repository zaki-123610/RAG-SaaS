from fastapi import APIRouter, Header, HTTPException, Request, status
from pydantic import BaseModel

from app.limiter import limiter
from db.bots import count_queries_today, get_public_bot, log_query
from rag.generation import answer

public_router = APIRouter()


class PublicQueryRequest(BaseModel):
    bot_id: str
    question: str


@public_router.post("/query")
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