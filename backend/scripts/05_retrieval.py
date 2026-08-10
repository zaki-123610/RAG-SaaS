import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name="paraphrase-multilingual-MiniLM-L12-v2"
)

client = chromadb.PersistentClient(path="chroma_db")

collection = client.get_collection(
    name="test",
    embedding_function=embedding_fn,
)

question = "c est quoi le probleme avec les langues autres que l anglais"

resultat = collection.query(
    query_texts=[question],
    n_results=3,
)

print("question :", question)
print("chunks dans la base :", collection.count())
print()

for i in range(len(resultat["ids"][0])):
    print("---", resultat["ids"][0][i], "| distance", round(resultat["distances"][0][i], 4), "---")
    print(resultat["documents"][0][i][:200])
    print()