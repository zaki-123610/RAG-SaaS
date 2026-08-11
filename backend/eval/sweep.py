import sys

import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

sys.path.append(".")
from eval.golden_set import GOLDEN_SET
from rag.chunking import split_pdf
from rag.store import EMBEDDING_MODEL, CHROMA_PATH

CONFIGS = [(300, 80), (500, 100), (800, 150)]
TOP_K = 3
PDF = "data/test2.pdf"

embedding_fn = SentenceTransformerEmbeddingFunction(model_name=EMBEDDING_MODEL)
client = chromadb.PersistentClient(path=CHROMA_PATH)

for size, overlap in CONFIGS:
    chunks = split_pdf(PDF, chunk_size=size, overlap=overlap)

    if "sweep" in [c.name for c in client.list_collections()]:
        client.delete_collection("sweep")
    col = client.create_collection(name="sweep", embedding_function=embedding_fn)
    col.add(ids=[f"c_{i}" for i in range(len(chunks))], documents=chunks)

    hits = 0
    for item in GOLDEN_SET:
        trouves = col.query(query_texts=[item["question"]], n_results=TOP_K)["documents"][0]
        for t in trouves:
            if item["expected"].lower() in t.lower():
                hits += 1
                break

    print(f"size={size:4} overlap={overlap:3} chunks={len(chunks):3} -> {hits}/{len(GOLDEN_SET)} = {round(hits/len(GOLDEN_SET)*100, 1)}%")

client.delete_collection("sweep")