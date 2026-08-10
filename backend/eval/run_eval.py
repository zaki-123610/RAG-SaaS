import sys
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

sys.path.append(".")
from eval.golden_set import GOLDEN_SET

TOP_K = 3

embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name="paraphrase-multilingual-MiniLM-L12-v2"
)

client = chromadb.PersistentClient(path="chroma_db")
collection = client.get_collection(name="test", embedding_function=embedding_fn)

hits = 0
echecs = []

for item in GOLDEN_SET:
    resultat = collection.query(query_texts=[item["question"]], n_results=TOP_K)
    trouves = resultat["ids"][0]

    if item["expected"] in trouves:
        hits += 1
        statut = "OK "
    else:
        statut = "RATE"
        echecs.append(item)

    print(statut, "|", item["expected"], "| top3:", trouves, "|", item["question"][:45])

total = len(GOLDEN_SET)
print()
print(f"HIT RATE : {hits}/{total} = {round(hits / total * 100, 1)}%")

if echecs:
    print()
    print("ECHECS :")
    for e in echecs:
        print(" -", e["question"], "-> attendait", e["expected"])