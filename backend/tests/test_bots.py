import pytest

from tests.helpers import PASSWORD


@pytest.fixture
def second_user(client):
    """Un deuxieme compte, pour tester l isolation."""
    import uuid
    from db.connection import pool

    email = f"other_{uuid.uuid4().hex[:8]}@example.com"
    res = client.post("/auth/register", json={"email": email, "password": PASSWORD})
    token = res.json()["access_token"]
    yield {"headers": {"Authorization": f"Bearer {token}"}}
    with pool.connection() as conn:
        conn.execute("DELETE FROM users WHERE email = %s", (email,))


@pytest.fixture
def bot(client, user):
    res = client.post("/bots", headers=user["headers"], json={"name": "Bot de test"})
    return res.json()["id"]


def test_creer_un_bot(client, user):
    res = client.post("/bots", headers=user["headers"], json={"name": "Mon bot"})
    assert res.status_code == 200
    assert res.json()["name"] == "Mon bot"
    assert res.json()["chunks"] == 0


def test_creer_un_bot_sans_token(client):
    assert client.post("/bots", json={"name": "X"}).status_code == 401


def test_lister_ses_bots(client, user, bot):
    res = client.get("/bots", headers=user["headers"])
    assert res.status_code == 200
    assert bot in [b["id"] for b in res.json()]


def test_ne_voit_pas_les_bots_des_autres(client, second_user, bot):
    res = client.get("/bots", headers=second_user["headers"])
    assert bot not in [b["id"] for b in res.json()]


def test_query_sur_bot_d_autrui(client, second_user, bot):
    res = client.post("/query", headers=second_user["headers"], json={"bot_id": bot, "question": "test"})
    assert res.status_code == 403


def test_documents_sur_bot_d_autrui(client, second_user, bot):
    res = client.get(f"/bots/{bot}/documents", headers=second_user["headers"])
    assert res.status_code == 403


def test_supprimer_bot_d_autrui(client, second_user, bot):
    res = client.delete(f"/bots/{bot}", headers=second_user["headers"])
    assert res.status_code == 404


def test_publier_bot_d_autrui(client, second_user, bot):
    res = client.patch(
        f"/bots/{bot}/publish",
        headers=second_user["headers"],
        json={"is_public": True, "allowed_origins": []},
    )
    assert res.status_code == 404


def test_supprimer_son_bot(client, user, bot):
    assert client.delete(f"/bots/{bot}", headers=user["headers"]).status_code == 204
    assert client.delete(f"/bots/{bot}", headers=user["headers"]).status_code == 404


def test_bot_non_publie_inaccessible(client, bot):
    res = client.post("/public/query", json={"bot_id": bot, "question": "test"})
    assert res.status_code == 404