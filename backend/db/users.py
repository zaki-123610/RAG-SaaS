from db.connection import pool


def create_user(email: str, hashed_password: str) -> int | None:
    """Insere un user. Retourne son id, ou None si l email existe deja."""
    with pool.connection() as conn:
        row = conn.execute(
            """
            INSERT INTO users (email, password)
            VALUES (%s, %s)
            ON CONFLICT (email) DO NOTHING
            RETURNING id
            """,
            (email, hashed_password),
        ).fetchone()
    return row[0] if row else None


def get_user_by_email(email: str) -> dict | None:
    """Retourne le user complet (id, email, password) ou None."""
    with pool.connection() as conn:
        row = conn.execute(
            "SELECT id, email, password FROM users WHERE email = %s",
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