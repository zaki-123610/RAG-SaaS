import numpy as np

from db.connection import pool
from rag.embeddings import embed
from langfuse import observe
TOP_K = 3

@observe(name="pgvector-search")
def search(question: str, bot_id: str, top_k: int = TOP_K) -> list[str]:
    """Retourne les chunks les plus proches de la question."""
    vecteur = np.array(embed([question], is_query=True)[0])

    with pool.connection() as conn:
        rows = conn.execute(
            """
            SELECT content
            FROM chunks
            WHERE bot_id = %s
            ORDER BY embedding <=> %s
            LIMIT %s
            """,
            (bot_id, vecteur, top_k),
        ).fetchall()

    return [r[0] for r in rows]