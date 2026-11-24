from pathlib import Path

RACINE = Path(__file__).resolve().parents[2]


def test_les_deux_copies_du_widget_sont_identiques():
    """widget.js est servi par le frontend (CDN, bulle immediate) et par le
    backend (/static/widget.js, pour les integrations existantes). Les deux
    fichiers doivent rester identiques : modifier l un, copier vers l autre."""
    backend = (RACINE / "backend" / "static" / "widget.js").read_bytes().replace(b"\r\n", b"\n")
    frontend = (RACINE / "frontend" / "public" / "widget.js").read_bytes().replace(b"\r\n", b"\n")
    assert backend == frontend
