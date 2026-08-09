from sentence_transformers import SentenceTransformer
from scipy.spatial import distance

model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")

docs = [
    "Le chat dort sur le canape.",
    "Le felin fait la sieste.",
    "Python est un langage de programmation.",
    "Les tarifs etudiants sont de 2000 DA par mois.",
]

doc_vectors = model.encode(docs)

question = "combien coute l abonnement pour un etudiant"
q_vector = model.encode(question)

for i, v in enumerate(doc_vectors):
    d = distance.cosine(q_vector, v)
    print(round(d, 4), "|", docs[i])