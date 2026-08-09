from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

court = "Le chat dort."
long = "Le chat dort sur le canape. " * 100

v_court = model.encode(court)
v_long = model.encode(long)

print("texte court :", len(court.split()), "mots ->", v_court.shape)
print("texte long  :", len(long.split()), "mots ->", v_long.shape)
print()
print("5 premieres valeurs :", v_court[:5])
print("min :", v_court.min(), "| max :", v_court.max())