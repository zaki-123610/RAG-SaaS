# DocuMind (RAG-SaaS)

Plateforme SaaS multi-tenant de Retrieval-Augmented Generation : chaque utilisateur crée un ou plusieurs **bots**, upload des PDF qui y sont indexés, puis pose des questions dont la réponse est générée uniquement à partir du contenu indexé (isolation stricte par utilisateur et par bot).

## Stack technique

**Backend**
- FastAPI (Python) + Uvicorn
- Auth : JWT (`python-jose`, HS256, expiration 24h) + hashing `bcrypt`
- Base de données relationnelle : PostgreSQL (`psycopg`) — tables `users` / `bots`
- Base vectorielle : ChromaDB (une collection par `bot_id`)
- Embeddings : Jina AI (`jina-embeddings-v3`)
- Chunking : LangChain `RecursiveCharacterTextSplitter`, `pypdf` pour l'extraction PDF
- LLM : Groq (`llama-3.3-70b-versatile`), prompt system anti-hallucination

**Frontend**
- React 19 + Vite
- Animations : GSAP
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
│   │   ├── main.py                   # Point d'entrée FastAPI (CORS, startup → init_db, routers)
│   │   ├── routes.py                 # Routes /health, /me, /bots, /upload, /query
│   │   ├── auth_routes.py            # Routes /auth/register, /auth/login
│   │   └── security.py               # Hashing bcrypt, JWT, get_current_user
│   │
│   ├── db/                           # Accès base de données
│   │   ├── connection.py             # Pool de connexion + init_db()
│   │   ├── schema.sql                # Schéma SQL (users, bots)
│   │   ├── users.py                  # Requêtes users
│   │   └── bots.py                   # Requêtes bots (dont user_owns_bot)
│   │
│   ├── rag/                          # Pipeline RAG
│   │   ├── chunking.py               # Extraction PDF + découpage en chunks
│   │   ├── retrieval.py              # Récupération des chunks pertinents (top_k)
│   │   ├── generation.py             # Contexte + question → réponse LLM (Groq)
│   │   └── store.py                  # Vector store Chroma, index_document()
│   │
│   ├── eval/                         # Évaluation du pipeline RAG
│   │   ├── golden_set.py             # Jeu de questions/réponses de référence
│   │   ├── run_eval.py               # Hit-rate du retrieval en place (embeddings Jina)
│   │   ├── sweep.py                  # Comparaison de tailles de chunk/overlap
│   │   └── legacy_*_sentencetransformers.py  # Anciennes versions (autre modèle d'embedding, gardées à titre de référence)
│   │
│   ├── scripts/                      # Scripts d'exploration/expérimentation (non utilisés par l'app)
│   │   ├── 01_embeddings.py … 05_retrieval.py
│   │   └── rag_test.py
│   │
│   ├── chroma_db/                    # Base vectorielle Chroma (données binaires, non versionné)
│   ├── data/                         # Documents sources (PDF de test)
│   └── uploads/                      # Fichiers uploadés (temporaires, supprimés après indexation)
│
├── frontend/                         # Application React (Vite)
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── main.jsx                  # Point d'entrée React
│       ├── App.jsx                   # Composant racine, routing d'écrans, état global
│       ├── api.js                    # Appels API vers le backend (auth, bots, upload, query)
│       ├── config.js                 # Constantes UI (couleurs des bots, capacité mémoire)
│       ├── styles.css                # Styles globaux
│       └── components/
│           ├── Landing.jsx           # Page d'accueil publique
│           ├── Login.jsx             # Connexion / inscription
│           ├── Dashboard.jsx         # Liste des bots + création
│           ├── Sidebar.jsx           # Navigation (Mes bots / Profil / déconnexion)
│           ├── BotCard.jsx           # Ligne d'un bot dans le dashboard
│           ├── BotIcon.jsx / Logo.jsx
│           ├── ChatScreen.jsx        # Écran de chat d'un bot (upload + conversation)
│           ├── DocumentsPanel.jsx    # Upload de documents dans ChatScreen
│           ├── Composer.jsx / Messages.jsx
│           └── Profile.jsx           # Profil utilisateur, statistiques
│
└── README.md
```

## API (backend)

| Méthode | Route             | Description                                        | Auth | Vérification |
|---------|-------------------|-----------------------------------------------------|------|--------------|
| GET     | `/health`         | Vérifie que l'API répond                             | Non  | — |
| POST    | `/auth/register`  | Crée un compte (email + mot de passe ≥ 8 car.)       | Non  | — |
| POST    | `/auth/login`     | Authentifie et retourne un token JWT                 | Non  | — |
| GET     | `/me`             | Retourne l'utilisateur courant                       | Oui  | — |
| GET     | `/bots`           | Liste les bots de l'utilisateur courant              | Oui  | — |
| POST    | `/bots`           | Crée un bot pour l'utilisateur courant               | Oui  | — |
| POST    | `/upload`         | Upload un PDF (`multipart`, champs `bot_id` + `file`) et l'indexe | Oui  | `bot_id` doit appartenir à l'utilisateur (403 sinon), content-type PDF requis |
| POST    | `/query`          | Pose une question `{bot_id, question}` sur un bot    | Oui  | `bot_id` doit appartenir à l'utilisateur (403 sinon) |

Auth = header `Authorization: Bearer <jwt>`. Aucun endpoint de suppression (bot ou compte) n'existe encore côté backend — les boutons correspondants dans [Profile.jsx](frontend/src/components/Profile.jsx) sont volontairement désactivés.

## Installation & lancement

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Nécessite un fichier `backend/.env` (non versionné) avec `DATABASE_URL` (PostgreSQL), `JWT_SECRET`, `JINA_API_KEY` et `GROQ_API_KEY`. Les tables sont créées automatiquement au démarrage (`init_db()` dans [main.py](backend/app/main.py)).

### Frontend

```bash
cd frontend
npm install
npm run dev
```

L'app est servie par défaut sur `http://localhost:5173` et communique avec le backend via `VITE_API_URL` (fichier `frontend/.env`, non versionné). CORS déjà configuré côté backend dans [main.py](backend/app/main.py) pour `localhost:5173` et le domaine de production.

## Évaluation du RAG

Le dossier [backend/eval/](backend/eval/) contient un jeu de données de référence (`golden_set.py`) et des scripts pour mesurer la qualité du retrieval (`run_eval.py`, embeddings Jina — ceux réellement utilisés en production) et comparer différentes tailles de chunk/overlap (`sweep.py`). Les fichiers `legacy_*_sentencetransformers.py` utilisent un autre modèle d'embedding et servent de référence historique, pas de mesure de la qualité en production.
