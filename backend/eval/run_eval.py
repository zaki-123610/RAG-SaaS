import sys

sys.path.append(".")
from eval.golden_set import GOLDEN_SET
from rag.retrieval import search

import os

BOT_ID = os.environ.get("EVAL_BOT_ID") or sys.exit(
    "Definis EVAL_BOT_ID (dans backend/.env) avec l'id du bot qui contient le PDF d'evaluation."
)

hits = 0
echecs = []

for item in GOLDEN_SET:
    chunks = search(item["question"], BOT_ID)
    trouve = False

    trouve = False
    for t in chunks:
        if item["expected"].lower() in t.lower():
            trouve = True
            break

    if trouve:
        hits += 1
        print("OK  |", item["question"][:45])
    else:
        echecs.append(item)
        print("RATE |", item["question"][:45])

total = len(GOLDEN_SET)
print()
print(f"HIT RATE : {hits}/{total} = {round(hits / total * 100, 1)}%")

for e in echecs:
    print(" -", e["question"], "-> cherchait:", e["expected"])