# DocuMind (RAG-SaaS)

Plateforme SaaS multi-tenant de Retrieval-Augmented Generation : chaque utilisateur crée un ou plusieurs **bots**, upload des PDF qui y sont indexés, puis pose des questions dont la réponse est générée uniquement à partir du contenu indexé (isolation stricte par utilisateur et par bot). Chaque bot peut aussi être **publié** comme widget de chat embarquable sur un site tiers.

## Qualité du retrieval

Hit rate mesuré sur un golden set de 16 questions (français) contre un
document technique en anglais — test cross-lingual.

| Itération                              | Hit rate |
|----------------------------------------|----------|
| Baseline                               | 75.0 %   |
| Labels du golden set corrigés          | 81.2 %   |
| Nettoyage des symboles mathématiques   | 93.8 %   |
| Migration pgvector + task query/passage| 93.8 %   |

Chaque changement de chunking ou de modèle est validé par `eval/run_eval.py`
avant d'être déployé.

## Stack technique

**Backend**
- FastAPI (Python) + Uvicorn
- Auth : JWT (`python-jose`, HS256, expiration 24h) + hashing `bcrypt`
- Base de données relationnelle : PostgreSQL (`psycopg`) — tables `users` / `bots` / `documents` / `chunks` / `public_queries`
- Base vectorielle : pgvector (colonne `embedding vector(1024)` sur `chunks`)
- Embeddings : Jina AI (`jina-embeddings-v3`)
- Chunking : LangChain `RecursiveCharacterTextSplitter`, `pypdf` pour l'extraction PDF
- LLM : Groq (`llama-3.3-70b-versatile`), prompt system anti-hallucination
- Rate limiting (`slowapi`) : `/auth/register` 5/h, `/auth/login` 10/min, `/upload` 10/h, `/query` 30/min, `/public/query` 20/min
- Widget embarquable : `backend/static/widget.js` servi statiquement, interroge `/public/query` (CORS ouvert, sans JWT)

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
│   │   ├── main.py                   # Point d'entrée FastAPI (CORS, CORS public dédié, startup → init_db, routers, /static)
│   │   ├── routes.py                 # Routes /health, /me, /bots, .../documents, /upload, /query, /bots/{id}/publish (auth)
│   │   ├── public_routes.py          # Route /public/query — appelée par le widget, sans auth, quota + origine vérifiés
│   │   ├── auth_routes.py            # Routes /auth/register, /auth/login
│   │   ├── security.py               # Hashing bcrypt, JWT, get_current_user
│   │   └── limiter.py                # Rate limiting (slowapi) sur auth, upload, query et public query
│   │
│   ├── db/                           # Accès base de données
│   │   ├── connection.py             # Pool de connexion + init_db()
│   │   ├── schema.sql                # Schéma SQL (users, bots, documents, chunks, public_queries + extension pgvector)
│   │   ├── users.py                  # Requêtes users
│   │   └── bots.py                   # Requêtes bots (dont user_owns_bot, set_public, get_public_bot, count_queries_today)
│   │
│   ├── rag/                          # Pipeline RAG
│   │   ├── chunking.py               # Extraction PDF + découpage en chunks
│   │   ├── embeddings.py             # Appel Jina AI, vecteurs 1024 dimensions
│   │   ├── retrieval.py              # Récupération des chunks pertinents (pgvector, top_k)
│   │   ├── generation.py             # Contexte + question → réponse LLM (Groq)
│   │   ├── store.py                  # Indexation Postgres/pgvector, index_document(), list_documents(), delete_document()
│   │   └── legacy_store_chromadb.py / legacy_retrieval_chromadb.py  # Anciennes versions (ChromaDB, avant migration pgvector), gardées à titre de référence
│   │
│   ├── eval/                         # Évaluation du pipeline RAG
│   │   ├── golden_set.py             # Jeu de questions/réponses de référence
│   │   ├── run_eval.py               # Hit-rate du retrieval en place (embeddings Jina, pgvector)
│   │   ├── sweep.py                  # Comparaison de tailles de chunk/overlap
│   │   └── legacy_*_sentencetransformers.py  # Anciennes versions (autre modèle d'embedding, gardées à titre de référence)
│   │
│   ├── scripts/                      # Scripts d'exploration/expérimentation (non utilisés par l'app)
│   │   ├── 01_embeddings.py … 05_retrieval.py
│   │   └── rag_test.py
│   │
│   ├── static/                       # Servi tel quel sur /static
│   │   ├── widget.js                 # Widget de chat embarquable (bulle + panneau, shadow DOM, appelle /public/query)
│   │   └── test.html                 # Page de test locale pour charger le widget
│   │
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
│       ├── api.js                    # Appels API vers le backend (auth, bots, documents, upload, query, publish)
│       ├── config.js                 # Constantes UI (couleurs des bots, capacité mémoire, défauts/couleurs du widget)
│       ├── styles.css                # Styles globaux
│       └── components/
│           ├── Landing.jsx           # Page d'accueil publique
│           ├── Login.jsx             # Connexion / inscription
│           ├── Dashboard.jsx         # Liste des bots + création, routage des écrans (bots/profil/publier/docs)
│           ├── Sidebar.jsx           # Navigation (Mes bots / Publier bot / Documentation / Profil / déconnexion)
│           ├── BotCard.jsx           # Ligne d'un bot dans le dashboard
│           ├── BotIcon.jsx / Logo.jsx
│           ├── ChatScreen.jsx        # Écran de chat d'un bot (upload + conversation)
│           ├── DocumentsPanel.jsx    # Upload de documents dans ChatScreen
│           ├── Composer.jsx / Messages.jsx
│           ├── Publish.jsx           # Publication d'un bot : origine autorisée, choix du bot, personnalisation du widget, snippet
│           ├── Docs.jsx              # Documentation d'intégration du widget (où le coller, attributs, dépannage)
│           └── Profile.jsx           # Profil utilisateur, statistiques, suppression de bot
│
└── README.md
```

## API (backend)

Auth = header `Authorization: Bearer <jwt>`.

| Méthode | Route                             | Description                                          | Auth | Vérification |
|---------|------------------------------------|-------------------------------------------------------|------|--------------|
| GET     | `/health`                          | Vérifie que l'API répond                               | Non  | — |
| POST    | `/auth/register`                   | Crée un compte (email + mot de passe ≥ 8 car.)         | Non  | — |
| POST    | `/auth/login`                      | Authentifie et retourne un token JWT                   | Non  | — |
| GET     | `/me`                               | Retourne l'utilisateur courant                         | Oui  | — |
| GET     | `/bots`                             | Liste les bots de l'utilisateur courant                | Oui  | — |
| POST    | `/bots`                             | Crée un bot pour l'utilisateur courant                 | Oui  | — |
| DELETE  | `/bots/{bot_id}`                    | Supprime un bot et son AI Memory (204)                 | Oui  | Le bot doit appartenir à l'utilisateur (404 sinon) |
| GET     | `/bots/{bot_id}/documents`          | Liste les documents indexés d'un bot                    | Oui  | `bot_id` doit appartenir à l'utilisateur (403 sinon) |
| DELETE  | `/bots/{bot_id}/documents/{doc_id}`| Supprime un document et ses chunks (204)                | Oui  | `bot_id` doit appartenir à l'utilisateur (403 sinon) |
| POST    | `/upload`                           | Upload un PDF (`multipart`, champs `bot_id` + `file`) et l'indexe | Oui  | `bot_id` doit appartenir à l'utilisateur (403 sinon), content-type PDF requis, 10 Mo max |
| POST    | `/query`                            | Pose une question `{bot_id, question}` sur un bot       | Oui  | `bot_id` doit appartenir à l'utilisateur (403 sinon) |
| PATCH   | `/bots/{bot_id}/publish`            | Publie/dépublie un bot `{is_public, allowed_origins}`    | Oui  | `bot_id` doit appartenir à l'utilisateur (404 sinon) |

Aucun endpoint de suppression de compte n'existe encore côté backend — le bouton correspondant dans [Profile.jsx](frontend/src/components/Profile.jsx) est volontairement désactivé.

### Endpoint public (widget embarqué)

Monté sous `/public`, avec sa propre politique CORS (`Access-Control-Allow-Origin: *`), sans JWT — c'est ce que consomme [widget.js](backend/static/widget.js).

| Méthode | Route           | Description | Vérification |
|---------|-----------------|-------------|---------------|
| POST    | `/public/query` | Pose une question `{bot_id, question}` sur un bot publié | Bot publié (`is_public`), origine dans `allowed_origins` si non vide (403 sinon), quota `daily_limit` (429 si atteint), question non vide |

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

### Widget embarquable

Depuis l'écran « Publier bot » du frontend, un utilisateur choisit un bot, une origine autorisée et personnalise couleur/position/titre, puis obtient un snippet du type :

```html
<script src="http://127.0.0.1:8000/static/widget.js"
        data-bot-id="VOTRE_BOT_ID"
        data-color="#2563EB"
        data-position="bottom-left"
        data-title="Support"></script>
```

À coller avant `</body>` du site cible. Voir [Docs.jsx](frontend/src/components/Docs.jsx) pour le détail des attributs et [backend/static/test.html](backend/static/test.html) pour un exemple de page hôte.

## Évaluation du RAG

Le dossier [backend/eval/](backend/eval/) contient un jeu de données de référence (`golden_set.py`) et des scripts pour mesurer la qualité du retrieval (`run_eval.py`, embeddings Jina — ceux réellement utilisés en production) et comparer différentes tailles de chunk/overlap (`sweep.py`). Les fichiers `legacy_*_sentencetransformers.py` utilisent un autre modèle d'embedding et servent de référence historique, pas de mesure de la qualité en production.
