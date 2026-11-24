import re

from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

CHUNK_SIZE = 500
CHUNK_OVERLAP = 100
SEPARATEURS = ["\n\n", "\n", ". ", " ", ""]
MAX_PAGES = 200


class PdfTropLong(ValueError):
    """Le PDF depasse le nombre de pages autorise."""


def nettoyer(texte: str) -> str:
    """Retire les symboles mathematiques qui noient le texte utile."""
    texte = re.sub(r"[\U0001D400-\U0001D7FF]", " ", texte)
    texte = re.sub(r"[∑∏√≠≤≥±∞⇒→➔➢−]", " ", texte)
    texte = re.sub(r"\s+", " ", texte)
    return texte.strip()


def lire_pdf(path: str, max_pages: int = MAX_PAGES) -> str:
    """Extrait le texte de toutes les pages d un PDF."""
    reader = PdfReader(path)
    if len(reader.pages) > max_pages:
        raise PdfTropLong(f"Le PDF depasse {max_pages} pages.")
    texte = ""
    for page in reader.pages:
        texte += page.extract_text()
    return texte

def est_lisible(chunk: str) -> bool:
    """Ecarte les chunks composes majoritairement de symboles."""
    lettres = sum(c.isalpha() and c.isascii() for c in chunk)
    return lettres / max(len(chunk), 1) > 0.5

def split_pdf(path: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    texte = nettoyer(lire_pdf(path))

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        separators=SEPARATEURS,
    )
    chunks = splitter.split_text(texte)
    return [c for c in chunks if est_lisible(c)]