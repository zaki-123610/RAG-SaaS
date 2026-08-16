import numpy as np
from pgvector.psycopg import register_vector

from db.connection import pool
from rag.embeddings import embed

TOP_K = 3


def search(question: str, bot_id: str, top_k: int = TOP_K) -> list[str]:
    """Retourne les chunks les plus proches de la question."""
    vecteur = np.array(embed([question], is_query=True)[0])

    with pool.connection() as conn:
        register_vector(conn)
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