from app.login_guard import MAX_ECHECS
from tests.helpers import PASSWORD


def test_register_retourne_un_token(client, email):
    res = client.post("/auth/register", json={"email": email, "password": PASSWORD})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_register_refuse_les_doublons(client, user):
    res = client.post("/auth/register", json={"email": user["email"], "password": PASSWORD})
    assert res.status_code == 409


def test_register_refuse_les_doublons_avec_une_autre_casse(client, user):
    res = client.post("/auth/register", json={"email": user["email"].upper(), "password": PASSWORD})
    assert res.status_code == 409


def test_register_refuse_password_court(client, email):
    res = client.post("/auth/register", json={"email": email, "password": "court"})
    assert res.status_code == 400


def test_register_refuse_password_courant(client, email):
    res = client.post("/auth/register", json={"email": email, "password": "motdepasse123"})
    assert res.status_code == 400
    assert "courant" in res.json()["detail"]


def test_register_refuse_plus_de_72_octets(client, email):
    # 40 caracteres mais 80 octets : bcrypt ignorerait la fin du mot de passe.
    res = client.post("/auth/register", json={"email": email, "password": "é" * 40})
    assert res.status_code == 400
    assert "72 octets" in res.json()["detail"]


def test_register_refuse_password_geant_sans_le_renvoyer(client, email):
    geant = "x" * 5000
    res = client.post("/auth/register", json={"email": email, "password": geant})
    assert res.status_code == 422
    assert isinstance(res.json()["detail"], str)
    assert geant not in res.text


def test_register_refuse_password_contenant_l_email(client):
    res = client.post(
        "/auth/register",
        json={"email": "martin.dupont@example.com", "password": "martin.dupont-2026"},
    )
    assert res.status_code == 400


def test_register_refuse_email_invalide(client):
    res = client.post("/auth/register", json={"email": "pas-un-email", "password": PASSWORD})
    assert res.status_code == 422
    assert res.json()["detail"] == "Adresse email invalide."


def test_login_valide(client, user):
    res = client.post("/auth/login", json={"email": user["email"], "password": PASSWORD})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_ignore_la_casse_de_l_email(client, user):
    res = client.post("/auth/login", json={"email": user["email"].upper(), "password": PASSWORD})
    assert res.status_code == 200


def test_login_mauvais_password(client, user):
    res = client.post("/auth/login", json={"email": user["email"], "password": "faux"})
    assert res.status_code == 401


def test_login_email_inconnu(client):
    res = client.post("/auth/login", json={"email": "inconnu@example.com", "password": PASSWORD})
    assert res.status_code == 401


def test_login_bloque_apres_trop_d_echecs(client, user):
    for _ in range(MAX_ECHECS):
        res = client.post("/auth/login", json={"email": user["email"], "password": "mauvais-mdp"})
        assert res.status_code == 401

    # Meme avec le bon mot de passe, le compte est bloque pour un moment.
    res = client.post("/auth/login", json={"email": user["email"], "password": PASSWORD})
    assert res.status_code == 429
    assert int(res.headers["Retry-After"]) > 0


def test_login_refuse_un_corps_trop_gros(client):
    res = client.post(
        "/auth/login",
        content=b'{"email": "a@example.com", "password": "' + b"x" * 100_000 + b'"}',
        headers={"Content-Type": "application/json"},
    )
    assert res.status_code == 413


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
