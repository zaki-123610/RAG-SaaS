import sys
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

sys.path.append(".")
from eval.golden_set import GOLDEN_SET


embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name="paraphrase-multilingual-MiniLM-L12-v2"
)

client = chromadb.PersistentClient(path="chroma_db")
collection = client.get_collection(name="test", embedding_function=embedding_fn)

TOP_K = 3

hits = 0
echecs = []

for item in GOLDEN_SET:
    resultat = collection.query(query_texts=[item["question"]], n_results=TOP_K)
    textes = resultat["documents"][0]

    trouve = any(item["expected"].lower() in t.lower() for t in textes)

    if trouve:
        hits += 1
        statut = "OK "
    else:
        statut = "RATE"
        echecs.append(item)

    print(statut, "|", item["question"][:45])

total = len(GOLDEN_SET)
print()
print(f"HIT RATE : {hits}/{total} = {round(hits / total * 100, 1)}%")

if echecs:
    print()
    print("ECHECS :")
    for e in echecs:
        print(" -", e["question"], "-> cherchait:", e["expected"])