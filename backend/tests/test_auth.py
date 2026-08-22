def test_register_retourne_un_token(client, email):
    res = client.post("/auth/register", json={"email": email, "password": "motdepasse123"})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_register_refuse_les_doublons(client, user):
    res = client.post("/auth/register", json={"email": user["email"], "password": "motdepasse123"})
    assert res.status_code == 409


def test_register_refuse_password_court(client, email):
    res = client.post("/auth/register", json={"email": email, "password": "court"})
    assert res.status_code == 400


def test_register_refuse_email_invalide(client):
    res = client.post("/auth/register", json={"email": "pas-un-email", "password": "motdepasse123"})
    assert res.status_code == 422


def test_login_valide(client, user):
    res = client.post("/auth/login", json={"email": user["email"], "password": "motdepasse123"})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_mauvais_password(client, user):
    res = client.post("/auth/login", json={"email": user["email"], "password": "faux"})
    assert res.status_code == 401


def test_login_email_inconnu(client):
    res = client.post("/auth/login", json={"email": "inconnu@example.com", "password": "motdepasse123"})
    assert res.status_code == 401


def test_me_sans_token(client):
    assert client.get("/me").status_code == 401


def test_me_token_invalide(client):
    res = client.get("/me", headers={"Authorization": "Bearer nimportequoi"})
    assert res.status_code == 401


def test_me_avec_token(client, user):
    res = client.get("/me", headers=user["headers"])
    assert res.status_code == 200
    assert res.json()["email"] == user["email"]
    assert "password" not in res.json()