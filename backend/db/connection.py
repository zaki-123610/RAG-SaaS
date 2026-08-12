import os

from dotenv import load_dotenv
from psycopg_pool import ConnectionPool

load_dotenv()

pool = ConnectionPool(
    conninfo=os.getenv("DATABASE_URL"),
    min_size=1,
    max_size=5,
    open=True,
)


def init_db():
    """Cree les tables si elles n existent pas."""
    with open("db/schema.sql") as f:
        sql = f.read()
    with pool.connection() as conn:
        conn.execute(sql)


