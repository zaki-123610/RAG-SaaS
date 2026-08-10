import chromadb
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction
from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import re


reader = PdfReader("data/test2.pdf")
texte = ""
for page in reader.pages:
    texte += page.extract_text()

def nettoyer(texte):
    texte = re.sub(r"[\U0001D400-\U0001D7FF]", " ", texte)   
    texte = re.sub(r"[∑∏√≠≤≥±∞⇒→➔➢−]", " ", texte)
    texte = re.sub(r"\s+", " ", texte)
    return texte.strip()

texte = nettoyer(texte)   

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500, chunk_overlap=100,
    separators=["\n\n", "\n", ". ", " ", ""],
)
chunks = splitter.split_text(texte)      


def est_lisible(chunk):                   
    lettres = sum(c.isalpha() and c.isascii() for c in chunk)
    return lettres / max(len(chunk), 1) > 0.5


chunks = [c for c in chunks if est_lisible(c)]   

print("chunks apres filtre :", len(chunks))


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