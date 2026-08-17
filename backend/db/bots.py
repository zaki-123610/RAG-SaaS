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
            SELECT b.id, b.name, COUNT(c.id)
            FROM bots b
            LEFT JOIN chunks c ON c.bot_id = b.id
            WHERE b.user_id = %s
            GROUP BY b.id, b.name, b.created_at
            ORDER BY b.created_at DESC
            """,
            (user_id,),
        ).fetchall()
    return [{"id": r[0], "name": r[1], "chunks": r[2]} for r in rows]


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