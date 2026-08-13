# RAG-SaaS

Plateforme SaaS de Retrieval-Augmented Generation.

## Structure

RAG-SaaS/
│
├── backend/                          # API + logique RAG (Python)
│   ├── .env                          # Variables d'environnement (secrets, DB, etc.)
│   ├── requirements.txt              # Dépendances Python
│   ├── sortie.txt
│   │
│   ├── app/                          # Application FastAPI
│   │   ├── __init__.py
│   │   ├── main.py                   # Point d'entrée FastAPI
│   │   ├── routes.py                 # Routes RAG/bots (fichier ouvert dans l'IDE)
│   │   ├── auth_routes.py            # Routes /register, /login, /me
│   │   └── security.py               # Hashing bcrypt, JWT
│   │
│   ├── db/                           # Accès base de données
│   │   ├── __init__.py
│   │   ├── connection.py             # Connexion DB
│   │   ├── schema.sql                # Schéma SQL
│   │   ├── users.py                  # Requêtes users
│   │   └── bots.py                   # Requêtes bots
│   │
│   ├── rag/                          # Pipeline RAG
│   │   ├── __init__.py
│   │   ├── chunking.py               # Découpage des documents
│   │   ├── retrieval.py              # Récupération des chunks pertinents
│   │   ├── generation.py             # Génération de réponse (LLM)
│   │   └── store.py                  # Vector store (Chroma)
│   │
│   ├── eval/                         # Évaluation du système RAG
│   │   ├── __init__.py
│   │   ├── golden_set.py             # Jeu de données de référence
│   │   ├── run_eval.py / run_eval_test.py
│   │   └── sweep.py / sweep_test.py
│   │
│   ├── scripts/                      # Scripts d'exploration/expérimentation
│   │   ├── 01_embeddings.py
│   │   ├── 02_similarity.py
│   │   ├── 03_chunking.py
│   │   ├── 04_vector_store.py
│   │   ├── 05_retrieval.py
│   │   └── rag_test.py
│   │
│   ├── chroma_db/                    # Base vectorielle Chroma (données binaires)
│   ├── data/                         # Documents sources (PDF de test)
│   └── uploads/                      # Fichiers uploadés par les utilisateurs
│
├── frontend/                         # Application React (Vite)
│   ├── .env / .gitignore / .oxlintrc.json
│   ├── package.json / package-lock.json
│   ├── index.html
│   ├── vite.config.js
│   │
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   │
│   └── src/
│       ├── main.jsx                  # Point d'entrée React
│       ├── App.jsx                   # Composant racine
│       ├── api.js                    # Appels API vers le backend
│       ├── styles.css
│       │
│       └── components/
│           ├── Header.jsx
│           ├── Chat.jsx              # Interface de chat RAG
│           ├── Uploader.jsx          # Upload de documents
│           ├── DocStatus.jsx         # Statut d'indexation des docs
│           └── HowItWorks.jsx
│
├── README.md
└── .gitignore


## Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```
