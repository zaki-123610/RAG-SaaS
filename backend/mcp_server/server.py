from mcp.server.mcpserver import MCPServer

from db.bots import list_bots
from rag.retrieval import search
from rag.generation import answer

mcp = MCPServer("RAG SaaS")

USER_ID = 10

@mcp.tool()
def list_my_bots() -> str:
    """Liste les chatbots disponibles avec leur identifiant et le nombre
    de morceaux de documents indexes.

    Appelle toujours cet outil en premier pour obtenir un bot_id valide
    avant d'utiliser les autres outils.
    """
    bots = list_bots(USER_ID)
    if not bots:
        return "Aucun chatbot trouve."
    return "\n".join(f"{b['id']} — {b['name']} ({b['chunks']} chunks)" for b in bots)

@mcp.tool()
def search_documents(bot_id: str, query: str) -> str:
    """Recherche les passages les plus pertinents dans les documents d'un chatbot.

    Retourne le texte brut des documents, sans reformulation. Utilise cet
    outil quand tu veux lire toi-meme le contenu source pour raisonner dessus.

    Appelle list_my_bots() d'abord pour obtenir un bot_id valide.
    """
    try:
        chunks = search(query, bot_id)
    except Exception as e:
        return f"Erreur : {e}. Verifie le bot_id avec list_my_bots()."

    if not chunks:
        return "Aucun passage trouve. Ce chatbot n'a peut-etre aucun document indexe."

    return "\n\n---\n\n".join(chunks)


@mcp.tool()
def ask_bot(bot_id: str, question: str) -> str:
    """Pose une question a un chatbot et retourne une reponse deja redigee.

    Le chatbot cherche dans ses documents puis genere une reponse. Prefere
    search_documents() si tu veux lire les sources toi-meme.

    Appelle list_my_bots() d'abord pour obtenir un bot_id valide.
    """
    try:
        return answer(question, bot_id)
    except Exception as e:
        return f"Erreur : {e}. Verifie le bot_id avec list_my_bots()."


@mcp.prompt(title="Analyser un document")
def analyze_document(bot_id: str, sujet: str) -> str:
    """Prompt structure pour analyser un sujet dans les documents d'un bot."""
    return f"""Analyse ce que les documents du chatbot {bot_id} disent sur : {sujet}

Procede ainsi :
1. Utilise search_documents({bot_id}, "{sujet}") pour recuperer les passages
2. Lis les passages et identifie les points cles
3. Signale explicitement ce que les documents ne couvrent pas

Ne complete jamais avec tes connaissances generales sans le signaler."""

if __name__ == "__main__":
    mcp.run(transport="stdio")