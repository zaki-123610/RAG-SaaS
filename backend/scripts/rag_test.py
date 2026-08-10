import os
import chromadb
from dotenv import load_dotenv
from groq import Groq
from chromadb.utils.embedding_functions import SentenceTransformerEmbeddingFunction

load_dotenv()

embedding_fn = SentenceTransformerEmbeddingFunction(
    model_name="paraphrase-multilingual-MiniLM-L12-v2"
)

client = chromadb.PersistentClient(path="chroma_db")
collection = client.get_collection(name="test", embedding_function=embedding_fn)

groq = Groq(api_key=os.getenv("GROQ_API_KEY"))

question = "pourquoi il faut un modele multilingue"

resultat = collection.query(query_texts=[question], n_results=3)
contexte = "\n\n".join(resultat["documents"][0])

reponse = groq.chat.completions.create(
    model="llama-3.3-70b-versatile",
    temperature=0.1,
    messages=[
        {
            "role": "system",
            "content": "Reponds uniquement avec le contexte fourni. Si l'info n'y est pas, dis que tu ne sais pas.",
        },
        {
            "role": "user",
            "content": f"Contexte:\n{contexte}\n\nQuestion: {question}",
        },
    ],
)

print("QUESTION :", question)
print()
print("REPONSE :")
print(reponse.choices[0].message.content)