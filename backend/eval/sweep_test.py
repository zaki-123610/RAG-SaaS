import sys
import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

sys.path.append(".")
from eval.golden_set import GOLDEN_SET

CONFIGS = [(300, 80), (500, 100), (800, 150)]
TOP_K = 3

reader = PdfReader("data/test2.pdf")
texte = "".join(p.extract_text() for p in reader.pages)

embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name="paraphrase-multilingual-MiniLM-L12-v2"
)
client = chromadb.PersistentClient(path="chroma_db")

for size, overlap in CONFIGS:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=size, chunk_overlap=overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_text(texte)

    if "sweep" in [c.name for c in client.list_collections()]:
        client.delete_collection("sweep")
    col = client.create_collection(name="sweep", embedding_function=embedding_fn)
    col.add(ids=[f"c_{i}" for i in range(len(chunks))], documents=chunks)

    hits = 0

    for item in GOLDEN_SET:
        resultats = col.query(query_texts=[item["question"]], n_results=TOP_K)
        les_chunks_trouves = resultats["documents"][0]

        trouve = False
        for t in les_chunks_trouves:
            if item["expected"].lower() in t.lower():
                trouve = True
                break

        if trouve:
            hits += 1

    print(f"size={size:4} overlap={overlap:3} chunks={len(chunks):3} -> {hits}/{len(GOLDEN_SET)} = {round(hits/len(GOLDEN_SET)*100, 1)}%")