from typing import TypedDict


class AgentState(TypedDict):
    question: str
    bot_id: str
    query: str
    chunks: list[str]
    tentatives: int
    pertinent: bool
    answer: str