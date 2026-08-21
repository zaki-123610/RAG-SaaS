import uuid

from db.connection import pool


def create_bot(user_id: int, name: str) -> str:
    """Cree un bot et retourne son id."""
    bot_id = uuid.uuid4().hex[:12]
    with pool.connection() as conn:
        conn.execute(
            "INSERT INTO bots (id, user_id, name) VALUES (%s, %s, %s)",
            (bot_id, user_id, name),
        )
    return bot_id


def list_bots(user_id: int) -> list[dict]:
    """Retourne tous les bots d un user, avec le nombre reel de chunks."""
    with pool.connection() as conn:
        rows = conn.execute(
            """
            SELECT b.id, b.name, COUNT(c.id), b.is_public, b.allowed_origins
            FROM bots b
            LEFT JOIN chunks c ON c.bot_id = b.id
            WHERE b.user_id = %s
            GROUP BY b.id, b.name, b.created_at, b.is_public, b.allowed_origins
            ORDER BY b.created_at DESC
            """,
            (user_id,),
        ).fetchall()
    return [
        {
            "id": r[0],
            "name": r[1],
            "chunks": r[2],
            "is_public": r[3],
            "allowed_origins": r[4] or [],
        }
        for r in rows
    ]


def user_owns_bot(user_id: int, bot_id: str) -> bool:
    """Verifie qu un bot appartient bien a cet utilisateur."""
    with pool.connection() as conn:
        row = conn.execute(
            "SELECT 1 FROM bots WHERE id = %s AND user_id = %s",
            (bot_id, user_id),
        ).fetchone()
    return row is not None


def delete_bot(user_id: int, bot_id: str) -> bool:
    """Supprime un bot et tout son contenu. False si non trouve."""
    with pool.connection() as conn:
        row = conn.execute(
            "DELETE FROM bots WHERE id = %s AND user_id = %s RETURNING id",
            (bot_id, user_id),
        ).fetchone()
    return row is not None

def get_public_bot(bot_id: str) -> dict | None:
    """Retourne un bot publie, ou None s il n existe pas ou n est pas publie."""
    with pool.connection() as conn:
        row = conn.execute(
            """
            SELECT id, name, allowed_origins, daily_limit
            FROM bots
            WHERE id = %s AND is_public = TRUE
            """,
            (bot_id,),
        ).fetchone()
    if not row:
        return None
    return {
        "id": row[0],
        "name": row[1],
        "allowed_origins": row[2] or [],
        "daily_limit": row[3],
    }


def count_queries_today(bot_id: str) -> int:
    """Nombre de questions publiques posees a ce bot aujourd hui."""
    with pool.connection() as conn:
        row = conn.execute(
            """
            SELECT COUNT(*) FROM public_queries
            WHERE bot_id = %s AND created_at >= CURRENT_DATE
            """,
            (bot_id,),
        ).fetchone()
    return row[0]


def log_query(bot_id: str, question: str) -> None:
    """Enregistre une question publique."""
    with pool.connection() as conn:
        conn.execute(
            "INSERT INTO public_queries (bot_id, question) VALUES (%s, %s)",
            (bot_id, question),
        )


def set_public(user_id: int, bot_id: str, is_public: bool, origins: list[str]) -> bool:
    """Publie ou depublie un bot. False si le bot n appartient pas au user."""
    with pool.connection() as conn:
        row = conn.execute(
            """
            UPDATE bots SET is_public = %s, allowed_origins = %s
            WHERE id = %s AND user_id = %s
            RETURNING id
            """,
            (is_public, origins, bot_id, user_id),
        ).fetchone()
    return row is not None


