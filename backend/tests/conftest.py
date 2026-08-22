import os
import sys
import uuid

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.limiter import limiter
from app.main import app
from db.connection import pool

limiter.enabled = False


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def email():
    return f"test_{uuid.uuid4().hex[:8]}@example.com"


@pytest.fixture
def user(client, email):
    """Cree un compte et retourne ses infos + headers d auth."""
    res = client.post("/auth/register", json={"email": email, "password": "motdepasse123"})
    token = res.json()["access_token"]
    yield {"email": email, "headers": {"Authorization": f"Bearer {token}"}}
    with pool.connection() as conn:
        conn.execute("DELETE FROM users WHERE email = %s", (email,))