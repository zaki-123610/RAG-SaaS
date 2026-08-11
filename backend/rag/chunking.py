import re

from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

CHUNK_SIZE = 500
CHUNK_OVERLAP = 100
SEPARATEURS = ["\n\n", "\n", ". ", " ", ""]


def nettoyer(texte: str) -> str:
    """Retire les symboles mathematiques qui noient le texte utile."""
    texte = re.sub(r"[\U0001D400-\U0001D7FF]", " ", texte)
    texte = re.sub(r"[∑∏√≠≤≥±∞⇒→➔➢−]", " ", texte)
    texte = re.sub(r"\s+", " ", texte)
    return texte.strip()


def lire_pdf(path: str) -> str:
    """Extrait le texte de toutes les pages d un PDF."""
    reader = PdfReader(path)
    texte = ""
    for page in reader.pages:
        texte += page.extract_text()
    return texte

def est_lisible(chunk: str) -> bool:
    """Ecarte les chunks composes majoritairement de symboles."""
    lettres = sum(c.isalpha() and c.isascii() for c in chunk)
    return lettres / max(len(chunk), 1) > 0.5

def split_pdf(path: str) -> list[str]:
    """PDF -> liste de chunks nettoyes."""
    texte = nettoyer(lire_pdf(path))

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=SEPARATEURS,
    )
    chunks = splitter.split_text(texte)
    return [c for c in chunks if est_lisible(c)]