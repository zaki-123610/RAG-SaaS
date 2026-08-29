import os

from dotenv import load_dotenv
from groq import Groq

from rag.retrieval import search
from rag.generation import answer as generer_reponse
from agent.state import AgentState

load_dotenv()

MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
MAX_TENTATIVES = 2

groq = Groq(api_key=os.getenv("GROQ_API_KEY"))


def retrieve(state: AgentState) -> dict:
    """Cherche les chunks correspondant a la requete courante."""
    return {"chunks": search(state["query"], state["bot_id"])}


def grade(state: AgentState) -> dict:
    """Evalue si les chunks repondent vraiment a la question d'origine."""
    if not state["chunks"]:
        return {}

    contexte = "\n\n---\n\n".join(c[:400] for c in state["chunks"])

    reponse = groq.chat.completions.create(
        model=MODEL,
        temperature=0,
        messages=[
            {
                "role": "system",
                "content": (
                    "Tu evalues si des extraits de documents permettent de repondre "
                    "a une question. Reponds uniquement par OUI ou NON, rien d'autre."
                ),
            },
            {
                "role": "user",
                "content": f"Question : {state['question']}\n\nExtraits :\n{contexte}\n\nCes extraits permettent-ils de repondre ?",
            },
        ],
    )

    verdict = reponse.choices[0].message.content.strip().upper()
    return {"pertinent": verdict.startswith("OUI")}


def rewrite(state: AgentState) -> dict:
    """Reformule la requete pour ameliorer la recherche."""
    reponse = groq.chat.completions.create(
        model=MODEL,
        temperature=0.3,
        messages=[
            {
                "role": "system",
                "content": (
                    "Reformule la question pour une recherche documentaire. "
                    "Utilise des termes techniques et des synonymes. "
                    "Reponds uniquement par la nouvelle requete, sans explication."
                ),
            },
            {
                "role": "user",
                "content": f"Question : {state['question']}\nRequete precedente : {state['query']}",
            },
        ],
    )

    return {
        "query": reponse.choices[0].message.content.strip(),
        "tentatives": state["tentatives"] + 1,
    }


def generate(state: AgentState) -> dict:
    """Genere la reponse finale a partir des chunks retenus."""
    return {"answer": generer_reponse(state["question"], state["bot_id"])}


def give_up(state: AgentState) -> dict:
    """Abandonne apres trop de tentatives."""
    return {
        "answer": "Je n'ai pas trouve d'information pertinente dans vos documents pour repondre a cette question."
    }