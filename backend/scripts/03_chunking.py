from pypdf import PdfReader
from langchain_text_splitters import RecursiveCharacterTextSplitter

reader = PdfReader("data/test2.pdf")

texte = ""
for page in reader.pages:
    texte += page.extract_text()

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=100,
    separators=["\n\n", "\n", ". ", " ", ""],
)

chunks = splitter.split_text(texte)

print("caracteres :", len(texte))
print("chunks     :", len(chunks))
print()

for i, c in enumerate(chunks):
    print("--- chunk", i, "|", len(c), "car ---")
    print(c)
    print()