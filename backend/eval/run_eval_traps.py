import sys

sys.path.append(".")
from eval.trap_set import TRAP_SET
from rag.generation import answer

BOT_ID = "236d854fe6ae"
REFUS = ["ne contient pas", "pas trouve", "je ne sais pas", "aucune information"]

refus = 0

for item in TRAP_SET:
    reponse = answer(item["question"], BOT_ID)
    a_refuse = any(m in reponse.lower() for m in REFUS)

    if a_refuse:
        refus += 1
        print("REFUS |", item["question"][:45])
    else:
        print("REPOND|", item["question"][:45])
        print("       ", reponse)

total = len(TRAP_SET)
print()
print(f"TAUX DE REFUS : {refus}/{total} = {round(refus / total * 100, 1)}%")