from rag.store import get_collection

TOP_K = 3


def search(question: str, bot_id: str, top_k: int = TOP_K) -> list[str]:
    """Retourne les chunks les plus proches de la question."""
    collection = get_collection(bot_id)
    resultat = collection.query(query_texts=[question], n_results=top_k)
    return resultat["documents"][0]