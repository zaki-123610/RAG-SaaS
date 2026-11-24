"""Regles de mot de passe a l inscription.

Inspire des recommandations NIST 800-63B : une longueur minimale, une liste
de mots de passe trop courants, pas de regles de composition forcees
(majuscule + chiffre + symbole) qui poussent vers des mots de passe
previsibles comme "Motdepasse1!".
"""

MIN_LENGTH = 10
MAX_BYTES = 72  # limite de bcrypt : au-dela, les octets sont ignores
MAX_CHARS = 128  # limite de taille du champ, avant meme le calcul en octets

COMMON = frozenset(
    {
        "motdepasse", "motdepasse1", "motdepasse12", "motdepasse123", "motdepasse1234",
        "monmotdepasse", "azertyuiop", "azertyuiop1", "azerty1234", "azerty12345",
        "azerty123456", "qwertyuiop", "qwerty1234", "qwerty12345", "qwerty123456",
        "password", "password1", "password12", "password123", "password1234",
        "passw0rd123", "1234567890", "12345678910", "123456789a", "0123456789",
        "9876543210", "1111111111", "0000000000", "abcdefghij", "abcd123456",
        "iloveyou123", "jetaime123", "bonjour123", "soleil1234", "football123",
        "baseball123", "princesse1", "chocolat123", "doudou1234", "loulou1234",
        "marseille13", "liverpool1", "superman123", "letmein123", "welcome123",
        "changeme123", "administrator", "administrateur", "admin12345", "admin123456",
        "utilisateur", "documind123", "ragsaas1234",
    }
)


def password_problem(password: str, email: str) -> str | None:
    """Retourne un message d erreur si le mot de passe est refuse, None sinon."""
    if len(password) < MIN_LENGTH:
        return f"Le mot de passe doit faire au moins {MIN_LENGTH} caractères."

    if len(password.encode("utf-8")) > MAX_BYTES:
        return (
            f"Le mot de passe est trop long ({MAX_BYTES} octets maximum, "
            "les lettres accentuées comptent double)."
        )

    lowered = password.lower()
    if lowered in COMMON:
        return "Ce mot de passe est trop courant, choisissez-en un autre."

    if len(set(password)) < 4:
        return "Le mot de passe est trop répétitif."

    local_part = email.split("@", 1)[0].lower()
    if len(local_part) >= 4 and local_part in lowered:
        return "Le mot de passe ne doit pas contenir votre adresse email."

    return None
