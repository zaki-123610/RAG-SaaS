from langgraph.graph import StateGraph, START, END

from agent.nodes import (
    MAX_TENTATIVES,
    generate,
    give_up,
    grade,
    retrieve,
    rewrite,
)
from agent.state import AgentState


def decider(state: AgentState) -> str:
    """Arete conditionnelle : ou aller apres l evaluation."""
    if state["pertinent"]:
        return "generate"
    if state["tentatives"] >= MAX_TENTATIVES:
        return "give_up"
    return "rewrite"


builder = StateGraph(AgentState)

builder.add_node("retrieve", retrieve)
builder.add_node("grade", grade)
builder.add_node("rewrite", rewrite)
builder.add_node("generate", generate)
builder.add_node("give_up", give_up)

builder.add_edge(START, "retrieve")
builder.add_edge("retrieve", "grade")
builder.add_conditional_edges(
    "grade",
    decider,
    {"generate": "generate", "rewrite": "rewrite", "give_up": "give_up"},
)
builder.add_edge("rewrite", "retrieve")
builder.add_edge("generate", END)
builder.add_edge("give_up", END)

graph = builder.compile()


def answer_crag(question: str, bot_id: str) -> dict:
    """Point d entree du pipeline CRAG."""
    resultat = graph.invoke({
        "question": question,
        "bot_id": bot_id,
        "query": question,
        "chunks": [],
        "tentatives": 0,
        "pertinent": False,
        "answer": "",
    })
    return {
        "answer": resultat["answer"],
        "tentatives": resultat["tentatives"],
        "chunks": len(resultat["chunks"]),
    }