# RAG-SaaS

Plateforme SaaS de Retrieval-Augmented Generation : upload de documents PDF, indexation vectorielle et chat questions/réponses basé sur le contenu indexé, avec authentification utilisateur (JWT).

## Stack technique

**Backend**
- FastAPI (Python) + Uvicorn
- Auth : JWT (`python-jose`) + hashing `bcrypt`
- Base de données relationnelle : PostgreSQL (`psycopg`)
- Base vectorielle : ChromaDB
- Pipeline RAG : LangChain / LangGraph, `pypdf` pour l'extraction PDF
- LLM : Groq

**Frontend**
- React 19 + Vite
- Lint : oxlint

## Structure

```
RAG-SaaS/
│
├── backend/                          # API + logique RAG (Python)
│   ├── .env                          # Variables d'environnement (non versionné)
│   ├── requirements.txt              # Dépendances Python
│   │
│   ├── app/                          # Application FastAPI
│   │   ├── main.py                   # Point d'entrée FastAPI (CORS, routers)
│   │   ├── routes.py                 # Routes /health, /upload, /query
│   │   ├── auth_routes.py            # Routes /auth/register, /auth/login
│   │   └── security.py               # Hashing bcrypt, JWT, get_current_user
│   │
│   ├── db/                           # Accès base de données
│   │   ├── connection.py             # Connexion DB
│   │   ├── schema.sql                # Schéma SQL
│   │   ├── users.py                  # Requêtes users
│   │   └── bots.py                   # Requêtes bots
│   │
│   ├── rag/                          # Pipeline RAG
│   │   ├── chunking.py               # Découpage des documents
│   │   ├── retrieval.py              # Récupération des chunks pertinents
│   │   ├── generation.py             # Génération de réponse (LLM)
│   │   └── store.py                  # Vector store (Chroma), index_document()
│   │
│   ├── eval/                         # Évaluation du système RAG
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
│   └── uploads/                      # Fichiers uploadés (temporaires)
│
├── frontend/                         # Application React (Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── main.jsx                  # Point d'entrée React
│       ├── App.jsx                   # Composant racine
│       ├── api.js                    # Appels API vers le backend
│       └── components/
│           ├── Header.jsx
│           ├── Chat.jsx              # Interface de chat RAG
│           ├── Uploader.jsx          # Upload de documents
│           ├── DocStatus.jsx         # Statut d'indexation des docs
│           └── HowItWorks.jsx
│
└── README.md
```

## API (backend)

| Méthode | Route            | Description                                  | Auth |
|---------|-------------------|-----------------------------------------------|------|
| GET     | `/health`         | Vérifie que l'API répond                       | Non  |
| GET     | `/me`             | Retourne l'utilisateur courant                 | Oui (JWT) |
| POST    | `/upload`         | Upload un PDF et l'indexe pour un `bot_id`     | Non* |
| POST    | `/query`          | Pose une question sur un `bot_id`              | Non* |
| POST    | `/auth/register`  | Crée un compte (email + mot de passe ≥ 8 car.) | Non  |
| POST    | `/auth/login`     | Authentifie et retourne un token JWT           | Non  |

\* Non protégées actuellement au niveau de la route ; à sécuriser si nécessaire.

## Installation & lancement

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Nécessite un fichier `backend/.env` (non versionné) avec, entre autres, les identifiants PostgreSQL, la clé secrète JWT et la clé API Groq.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

L'app est servie par défaut sur `http://localhost:5173` et communique avec le backend (CORS déjà configuré dans [main.py](backend/app/main.py)).

## Évaluation du RAG

Le dossier [backend/eval/](backend/eval/) contient un jeu de données de référence (`golden_set.py`) et des scripts pour mesurer la qualité des réponses (`run_eval.py`) et comparer différents paramètres du pipeline (`sweep.py`).
