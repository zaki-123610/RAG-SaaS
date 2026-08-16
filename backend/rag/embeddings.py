import os

import requests
from dotenv import load_dotenv

load_dotenv()

JINA_URL = "https://api.jina.ai/v1/embeddings"
MODEL = "jina-embeddings-v3"
DIMENSION = 1024


def embed(textes: list[str], is_query: bool = False) -> list[list[float]]:
    """Transforme une liste de textes en vecteurs via l API Jina."""
    reponse = requests.post(
        JINA_URL,
        headers={"Authorization": f"Bearer {os.getenv('JINA_API_KEY')}"},
        json={
            "model": MODEL,
            "task": "retrieval.query" if is_query else "retrieval.passage",
            "input": textes,
        },
        timeout=60,
    )
    reponse.raise_for_status()
    return [item["embedding"] for item in reponse.json()["data"]]