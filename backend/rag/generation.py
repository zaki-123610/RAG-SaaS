import os

from dotenv import load_dotenv
from groq import Groq

from rag.retrieval import search

load_dotenv()

MODEL = "llama-3.3-70b-versatile"
TEMPERATURE = 0.1

SYSTEM_PROMPT = (
    "Tu reponds UNIQUEMENT a partir du contexte fourni ci-dessous. "
    "Interdiction absolue d'utiliser tes connaissances generales. "
    "Si le contexte ne contient pas l'information, reponds exactement : "
    "\"Le document ne contient pas cette information.\" "
    "N'invente aucune formule, aucun exemple, aucune notation absente du contexte. "
    "Reponds dans la langue de la question."
)

groq = Groq(api_key=os.getenv("GROQ_API_KEY"))


def answer(question: str, bot_id: str) -> str:
    """Question -> chunks pertinents -> reponse redigee par le LLM."""
    chunks = search(question, bot_id)
    contexte = "\n\n".join(chunks)

    reponse = groq.chat.completions.create(
        model=MODEL,
        temperature=TEMPERATURE,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Contexte:\n{contexte}\n\nQuestion: {question}"},
        ],
    )
    return reponse.choices[0].message.content