from db.connection import pool


def create_user(email: str, hashed_password: str) -> int | None:
    """Insere un user. Retourne son id, ou None si l email existe deja.

    La comparaison ignore la casse, y compris pour les comptes crees avant
    la normalisation des emails en minuscules.
    """
    with pool.connection() as conn:
        row = conn.execute(
            """
            INSERT INTO users (email, password)
            SELECT %s, %s
            WHERE NOT EXISTS (SELECT 1 FROM users WHERE lower(email) = lower(%s))
            ON CONFLICT DO NOTHING
            RETURNING id
            """,
            (email, hashed_password, email),
        ).fetchone()
    return row[0] if row else None


def get_user_by_email(email: str) -> dict | None:
    """Retourne le user complet (id, email, password) ou None."""
    with pool.connection() as conn:
        row = conn.execute(
            """
            SELECT id, email, password FROM users
            WHERE lower(email) = lower(%s)
            ORDER BY id
            LIMIT 1
            """,
            (email,),
        ).fetchone()
    if not row:
        return None
    return {"id": row[0], "email": row[1], "password": row[2]}


def get_user_by_id(user_id: int) -> dict | None:
    """Retourne le user sans son password. Utilise par get_current_user."""
    with pool.connection() as conn:
        row = conn.execute(
            "SELECT id, email FROM users WHERE id = %s",
            (user_id,),
        ).fetchone()
    if not row:
        return None
    return {"id": row[0], "email": row[1]}

def get_usage(user_id: int) -> dict:
    """Retourne le nombre de chunks utilises et la limite du user."""
    with pool.connection() as conn:
        row = conn.execute(
            """
            SELECT u.chunk_limit, COALESCE(COUNT(c.id), 0)
            FROM users u
            LEFT JOIN bots b ON b.user_id = u.id
            LEFT JOIN chunks c ON c.bot_id = b.id
            WHERE u.id = %s
            GROUP BY u.id, u.chunk_limit
            """,
            (user_id,),
        ).fetchone()
    if not row:
        return {"limit": 0, "used": 0}
    return {"limit": row[0], "used": row[1]}
