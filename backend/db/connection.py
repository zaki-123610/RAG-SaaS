import os

from dotenv import load_dotenv
from psycopg_pool import ConnectionPool
from pgvector.psycopg import register_vector

load_dotenv()

def _configure(conn):
    """Execute a l ouverture de chaque connexion physique.
    Tolere l absence de l extension vector : elle est creee par init_db(),
    qui peut tourner apres l ouverture du pool (cas d une base neuve en CI).
    """
    try:
        register_vector(conn)
    except Exception:
        pass

pool = ConnectionPool(
    conninfo=os.getenv("DATABASE_URL"),
    min_size=1,
    max_size=5,
    configure=_configure,
    open=True,
)


def init_db():
    """Cree les tables si elles n existent pas."""
    with open("db/schema.sql") as f:
        sql = f.read()
    with pool.connection() as conn:
        conn.execute(sql)


