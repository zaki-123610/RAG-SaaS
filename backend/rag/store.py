import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

from rag.chunking import split_pdf

EMBEDDING_MODEL = "paraphrase-multilingual-MiniLM-L12-v2"
CHROMA_PATH = "chroma_db"

embedding_fn = SentenceTransformerEmbeddingFunction(model_name=EMBEDDING_MODEL)
client = chromadb.PersistentClient(path=CHROMA_PATH)


def get_collection(bot_id: str):
    """Ouvre la collection du bot, la cree si elle n existe pas."""
    return client.get_or_create_collection(
        name=bot_id,
        embedding_function=embedding_fn,
    )


def index_document(path: str, bot_id: str) -> int:
    """PDF -> chunks -> collection du bot. Retourne le nombre de chunks."""
    chunks = split_pdf(path)
    collection = get_collection(bot_id)

    depart = collection.count()
    collection.add(
        ids=[f"chunk_{depart + i}" for i in range(len(chunks))],
        documents=chunks,
    )
    return len(chunks)