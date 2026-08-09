import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

# --- reprise du script 03 : PDF -> chunks ---
reader = PdfReader("data/test.pdf")
texte = ""
for page in reader.pages:
    texte += page.extract_text()

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100,
    separators=["\n\n", "\n", ". ", " ", ""],
)
chunks = splitter.split_text(texte)

# --- nouveau : stockage dans ChromaDB ---
embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name="paraphrase-multilingual-MiniLM-L12-v2"
)

client = chromadb.PersistentClient(path="chroma_db")

if "test" in [c.name for c in client.list_collections()]:
    client.delete_collection("test")

collection = client.create_collection(
    name="test",
    embedding_function=embedding_fn,
)

collection.add(
    ids=[f"chunk_{i}" for i in range(len(chunks))],
    documents=chunks,
)

print("chunks decoupes :", len(chunks))
print("chunks stockes  :", collection.count())