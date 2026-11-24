"""Limites de taille, de quota et validation des entrees."""

import pytest
from starlette.requests import Request

import app.limiter as limiter_module
import app.routes as routes
from app.schemas import normaliser_origine
from db.bots import MAX_BOTS_PER_USER

FAUX_PDF = b"%PDF-1.4\n% faux pdf pour les tests\n"


@pytest.fixture
def bot(client, user):
    return client.post("/bots", headers=user["headers"], json={"name": "Bot limites"}).json()["id"]


def upload(client, user, bot, contenu=FAUX_PDF):
    return client.post(
        "/upload",
        headers=user["headers"],
        data={"bot_id": bot},
        files={"file": ("doc.pdf", contenu, "application/pdf")},
    )


# ---- questions ----

def test_question_trop_longue(client, user, bot):
    res = client.post("/query", headers=user["headers"], json={"bot_id": bot, "question": "x" * 1001})
    assert res.status_code == 422
    assert "question" in res.json()["detail"]


def test_question_vide(client, user, bot):
    res = client.post("/query", headers=user["headers"], json={"bot_id": bot, "question": "   "})
    assert res.status_code == 422


def test_question_publique_trop_longue(client, bot):
    res = client.post("/public/query", json={"bot_id": bot, "question": "x" * 1001})
    assert res.status_code == 422
    assert isinstance(res.json()["detail"], str)


# ---- bots ----

def test_nom_de_bot_trop_long(client, user):
    res = client.post("/bots", headers=user["headers"], json={"name": "x" * 81})
    assert res.status_code == 422


def test_nom_de_bot_vide(client, user):
    res = client.post("/bots", headers=user["headers"], json={"name": "   "})
    assert res.status_code == 422


def test_limite_de_bots_par_compte(client, user):
    for i in range(MAX_BOTS_PER_USER):
        assert client.post("/bots", headers=user["headers"], json={"name": f"Bot {i}"}).status_code == 200
    res = client.post("/bots", headers=user["headers"], json={"name": "Un de trop"})
    assert res.status_code == 400


# ---- origines autorisees ----

@pytest.mark.parametrize(
    "origine",
    ["javascript:alert(1)", "monsite.com", "https://monsite.com/chemin", "https://a@monsite.com", "ftp://monsite.com"],
)
def test_publier_refuse_une_origine_invalide(client, user, bot, origine):
    res = client.patch(
        f"/bots/{bot}/publish",
        headers=user["headers"],
        json={"is_public": True, "allowed_origins": [origine]},
    )
    assert res.status_code == 422


def test_publier_normalise_les_origines(client, user, bot):
    res = client.patch(
        f"/bots/{bot}/publish",
        headers=user["headers"],
        json={"is_public": True, "allowed_origins": ["HTTPS://MonSite.com:443/", "https://monsite.com"]},
    )
    assert res.status_code == 200
    assert res.json()["allowed_origins"] == ["https://monsite.com"]


def test_publier_refuse_trop_d_origines(client, user, bot):
    origines = [f"https://site{i}.com" for i in range(6)]
    res = client.patch(
        f"/bots/{bot}/publish",
        headers=user["headers"],
        json={"is_public": True, "allowed_origins": origines},
    )
    assert res.status_code == 422


def test_normaliser_origine():
    assert normaliser_origine("http://localhost:5173") == "http://localhost:5173"
    assert normaliser_origine("https://exemple.fr/") == "https://exemple.fr"
    assert normaliser_origine("http://exemple.fr:80") == "http://exemple.fr"


# ---- upload et quota ----

def test_upload_refuse_un_faux_pdf(client, user, bot):
    res = upload(client, user, bot, contenu=b"<html>pas un pdf</html>")
    assert res.status_code == 400


def test_quota_verifie_avant_l_embedding(client, user, bot, monkeypatch):
    """Un seul gros document ne doit plus pouvoir depasser le quota."""
    monkeypatch.setattr(routes, "split_pdf", lambda path: ["morceau"] * 10_000)

    def interdit(*args, **kwargs):
        raise AssertionError("index_chunks ne doit pas etre appele quand le quota est depasse")

    monkeypatch.setattr(routes, "index_chunks", interdit)

    res = upload(client, user, bot)
    assert res.status_code == 429
    assert "10000 morceaux" in res.json()["detail"]


def test_upload_dans_le_quota(client, user, bot, monkeypatch):
    monkeypatch.setattr(routes, "split_pdf", lambda path: ["un", "deux", "trois"])
    monkeypatch.setattr(routes, "index_chunks", lambda chunks, bot_id, filename: len(chunks))

    res = upload(client, user, bot)
    assert res.status_code == 200
    assert res.json()["chunks"] == 3


# ---- IP du client derriere un proxy ----

def _requete(client_host, forwarded=None):
    headers = [(b"x-forwarded-for", forwarded.encode())] if forwarded else []
    return Request({"type": "http", "client": (client_host, 1234), "headers": headers})


def test_client_ip_sans_proxy_de_confiance(monkeypatch):
    monkeypatch.setattr(limiter_module, "TRUSTED_PROXY_HOPS", 0)
    assert limiter_module.client_ip(_requete("10.0.0.1", "1.2.3.4")) == "10.0.0.1"


def test_client_ip_ignore_les_entrees_inventees_par_le_client(monkeypatch):
    monkeypatch.setattr(limiter_module, "TRUSTED_PROXY_HOPS", 1)
    # Le client envoie "6.6.6.6", le proxy ajoute la vraie IP a droite.
    assert limiter_module.client_ip(_requete("10.0.0.1", "6.6.6.6, 1.2.3.4")) == "1.2.3.4"


def test_client_ip_deux_proxys(monkeypatch):
    monkeypatch.setattr(limiter_module, "TRUSTED_PROXY_HOPS", 2)
    assert limiter_module.client_ip(_requete("10.0.0.1", "6.6.6.6, 1.2.3.4, 172.16.0.9")) == "1.2.3.4"
