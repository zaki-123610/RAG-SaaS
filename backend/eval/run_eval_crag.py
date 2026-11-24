import sys

sys.path.append(".")
from eval.golden_set import GOLDEN_SET
from agent.graph import graph

import os

BOT_ID = os.environ.get("EVAL_BOT_ID") or sys.exit(
    "Definis EVAL_BOT_ID (dans backend/.env) avec l'id du bot qui contient le PDF d'evaluation."
)

hits = 0
tentatives_totales = 0

for item in GOLDEN_SET:
    r = graph.invoke({
        "question": item["question"],
        "bot_id": BOT_ID,
        "query": item["question"],
        "chunks": [],
        "tentatives": 0,
        "pertinent": False,
        "answer": "",
    })

    tentatives_totales += r["tentatives"]

    trouve = False
    for t in r["chunks"]:
        if item["expected"].lower() in t.lower():
            trouve = True
            break

    if trouve:
        hits += 1
        print("OK  |", item["question"][:45])
    else:
        print("RATE |", item["question"][:45], "| tentatives:", r["tentatives"])

total = len(GOLDEN_SET)
print()
print(f"HIT RATE : {hits}/{total} = {round(hits / total * 100, 1)}%")
print(f"Reformulations totales : {tentatives_totales}")