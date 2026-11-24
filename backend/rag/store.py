

from db.connection import pool
from rag.chunking import split_pdf
from rag.embeddings import embed

import numpy as np

BATCH = 50


def index_document(path: str, bot_id: str, filename: str = "document.pdf") -> int:
    """PDF -> chunks -> vecteurs -> Postgres. Retourne le nombre de chunks."""
    return index_chunks(split_pdf(path), bot_id, filename)


def index_chunks(chunks: list[str], bot_id: str, filename: str = "document.pdf") -> int:
    """Chunks deja decoupes -> vecteurs -> Postgres. Retourne le nombre de chunks.

    Separe de index_document pour que la route d upload puisse verifier le
    quota entre le decoupage et l appel (payant) a l API d embedding.
    """
    if not chunks:
        return 0

    with pool.connection() as conn:

        doc_id = conn.execute(
            "INSERT INTO documents (bot_id, filename, chunks) VALUES (%s, %s, %s) RETURNING id",
            (bot_id, filename, len(chunks)),
        ).fetchone()[0]

        for debut in range(0, len(chunks), BATCH):
            lot = chunks[debut : debut + BATCH]
            vecteurs = embed(lot)

            with conn.cursor() as cur:
                cur.executemany(
                    "INSERT INTO chunks (bot_id, document_id, content, embedding) VALUES (%s, %s, %s, %s)",
                    [(bot_id, doc_id, texte, np.array(vec)) for texte, vec in zip(lot, vecteurs)],
                )

    return len(chunks)


def list_documents(bot_id: str) -> list[dict]:
    """Liste les documents d un bot."""
    with pool.connection() as conn:
        rows = conn.execute(
            "SELECT id, filename, chunks FROM documents WHERE bot_id = %s ORDER BY created_at DESC",
            (bot_id,),
        ).fetchall()
    return [{"id": r[0], "filename": r[1], "chunks": r[2]} for r in rows]

def delete_document(bot_id: str, document_id: int) -> bool:
    """Supprime un document et ses chunks. False si non trouve."""
    with pool.connection() as conn:
        row = conn.execute(
            "DELETE FROM documents WHERE id = %s AND bot_id = %s RETURNING id",
            (document_id, bot_id),
        ).fetchone()
    return row is not None