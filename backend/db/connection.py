import os

from dotenv import load_dotenv
from psycopg_pool import ConnectionPool
from pgvector.psycopg import register_vector

load_dotenv()

def _configure(conn):
    """Execute une fois a l ouverture de chaque connexion physique."""
    register_vector(conn)

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


