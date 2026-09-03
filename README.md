# DocuMind (RAG-SaaS)
![tests](https://github.com/zaki-123610/RAG-SaaS/actions/workflows/tests.yml/badge.svg)
**[Démo](https://rag-saa-s-theta.vercel.app)** · **[API](https://rag-saas-mdmd.onrender.com/docs)**

> Le backend tourne sur le plan gratuit Render : le premier appel
> peut prendre ~1 minute (cold start).


Plateforme SaaS multi-tenant de Retrieval-Augmented Generation : chaque utilisateur crée un ou plusieurs **bots**, upload des PDF qui y sont indexés, puis pose des questions dont la réponse est générée uniquement à partir du contenu indexé (isolation stricte par utilisateur et par bot). Chaque bot peut aussi être **publié** comme widget de chat embarquable sur un site tiers.

## Qualité du retrieval

Hit rate mesuré sur un golden set de 16 questions (français) contre un
document technique en anglais — test cross-lingual.

| Itération                              |     Hit rate    |
|----------------------------------------|-----------------|
| Baseline                               |     75.0 %      |
| Labels du golden set corrigés          |     81.2 %      |
| Nettoyage des symboles mathématiques   |     93.8 %      |
| Passage aux embeddings API (Jina, via ChromaDB) | 87.5 % |
| Migration pgvector + task query/passage|     93.8 %      |

La baisse à 87.5 % est le coût du passage à une API d'embedding, imposé par la contrainte mémoire de Render. Le gain final vient du paramètre task de Jina, qui distingue documents et requêtes.

Chaque changement de chunking ou de modèle est validé par `eval/run_eval.py`
avant d'être déployé.


## Pipeline agentique (Corrective RAG)

Un second pipeline construit avec LangGraph ajoute un nœud d'évaluation
des chunks : si les passages récupérés ne répondent pas à la question,
la requête est reformulée et la recherche relancée (2 tentatives max).


| Configuration      | Hit rate | Appels LLM / question |
|--------------------|----------|-----------------------|
| RAG simple, top-3  | 100 %    | 1                     |
| CRAG, top-3        | 100 %    | ~2.1                  |
| RAG simple, top-1  | 81.2 %   | 1                     |
| CRAG, top-1        | 100 %    | ~2.6                  |

Le CRAG rattrape intégralement les échecs de recherche en conditions
dégradées, mais n'apporte rien quand le retrieval est déjà bon — pour
un coût doublé. **Le pipeline simple reste en production.**

## Performance

Latence de `/query` mesurée via tracing Langfuse :

| Étape        | Avant  | Après |
|--------------|--------|-------|
| Embedding    | 647 ms | 647 ms |
| Recherche SQL| 2.15 s | 460 ms |
| Génération   | 800 ms | 600 ms |
| **Total**    | **3.6 s** | **1.7 s** |

Le tracing a montré que le goulot était `register_vector()`, appelé à
chaque recherche et coûtant un aller-retour réseau complet. Déplacé au
niveau du pool de connexions.

## Résistance aux hallucinations

Golden set de 16 questions dont la réponse n'existe pas dans le document,
dont 6 « dans le domaine » (le contexte semble pertinent, la réponse ne l'est pas).

| Configuration | Taux de refus |
|---------------|---------------|
| Prompt initial | 93.8 % |
| + interdiction explicite d'exemples numériques | 100 % * |

\* le seul « échec » restant était une question mal conçue de ma part :
la réponse figurait bien dans le document.

Un nœud Self-RAG de vérification aurait doublé le coût en appels LLM
pour corriger un cas qu'une ligne de prompt a réglé. **Non implémenté.**
## Stack technique

**Backend**
- FastAPI (Python) + Uvicorn
- Auth : JWT (`python-jose`, HS256, expiration 24h) + hashing `bcrypt`
- Base de données relationnelle : PostgreSQL (`psycopg`) — tables `users` / `bots` / `documents` / `chunks` / `public_queries`
- Base vectorielle : pgvector (colonne `embedding vector(1024)` sur `chunks`)
- Embeddings : Jina AI (`jina-embeddings-v3`)
- Chunking : LangChain `RecursiveCharacterTextSplitter`, `pypdf` pour l'extraction PDF
- LLM : Groq (`openai/gpt-oss-120b`), prompt system anti-hallucination
- Rate limiting (`slowapi`) : `/auth/register` 5/h, `/auth/login` 10/min, `/upload` 10/h, `/query` 30/min, `/public/query` 20/min
- Widget embarquable : `backend/static/widget.js` servi statiquement, interroge `/public/query` (CORS ouvert, sans JWT)
- Pipeline agentique : LangGraph (`agent/`) — Corrective RAG avec boucle de reformulation
- Observabilité : Langfuse (tracing des étapes embedding / retrieval / génération)
- Serveur MCP (`mcp_server/`) exposant le RAG comme outils pour Claude Desktop
- Tests : pytest + TestClient, CI GitHub Actions sur Postgres jetable
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
│   ├── agent/                        # Pipeline Corrective RAG (LangGraph)
│   │   ├── state.py                  # AgentState : question, query réécrite, chunks, tentatives, verdict, réponse
│   │   ├── nodes.py                  # Noeuds retrieve / grade / rewrite / generate / give_up (LLM Groq)
│   │   └── graph.py                  # Assemblage du graphe + boucle grade→rewrite→retrieve, answer_crag()
│   │
│   ├── db/                           # Accès base de données
│   │   ├── connection.py             # Pool de connexion + init_db()
│   │   ├── schema.sql                # Schéma SQL (users, bots, documents, chunks, public_queries + extension pgvector)
│   │   ├── users.py                  # Requêtes users
│   │   └── bots.py                   # Requêtes bots (dont user_owns_bot, set_public, get_public_bot, count_queries_today)
│   │
│   ├── rag/                          # Pipeline RAG (retrieval simple, utilisé par /query et par agent/)
│   │   ├── chunking.py               # Extraction PDF + découpage en chunks
│   │   ├── embeddings.py             # Appel Jina AI, vecteurs 1024 dimensions
│   │   ├── retrieval.py              # Récupération des chunks pertinents (pgvector, top_k)
│   │   ├── generation.py             # Contexte + question → réponse LLM (Groq)
│   │   ├── store.py                  # Indexation Postgres/pgvector, index_document(), list_documents(), delete_document()
│   │   └── legacy_store_chromadb.py / legacy_retrieval_chromadb.py  # Anciennes versions (ChromaDB, avant migration pgvector), gardées à titre de référence
│   │
│   ├── mcp_server/                   # Serveur MCP exposant le RAG comme outils pour Claude Desktop
│   │   ├── server.py                 # Outils list_my_bots / search_documents / ...
│   │   └── test_client.py            # Client de test du serveur MCP
│   │
│   ├── eval/                         # Évaluation du pipeline RAG
│   │   ├── golden_set.py             # Jeu de questions/réponses de référence
│   │   ├── run_eval.py               # Hit-rate du retrieval simple (embeddings Jina, pgvector)
│   │   ├── run_eval_crag.py          # Hit-rate du pipeline Corrective RAG (agent/graph.py)
│   │   ├── sweep.py                  # Comparaison de tailles de chunk/overlap
│   │   └── legacy_*_sentencetransformers.py  # Anciennes versions (autre modèle d'embedding, gardées à titre de référence)
│   │
│   ├── tests/                        # Tests automatisés (pytest)
│   │   ├── conftest.py               # Fixtures (client de test, base de données)
│   │   ├── test_auth.py              # Tests /auth/register, /auth/login
│   │   └── test_bots.py              # Tests des routes /bots
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
| GET | /usage | Chunks utilisés et limite du compte | Oui | — |

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

## Choix techniques

**Pas de chaîne RAG toute faite.** Le pipeline principal — chunking,
embedding, retrieval, prompt — est écrit explicitement pour pouvoir
être mesuré et débuggé étape par étape. LangChain n'est utilisé que
pour le text splitter, et LangGraph pour le pipeline agentique où
la machine à états apporte un vrai gain (boucles, routage conditionnel).

**Embeddings via API plutôt qu'en local.** `sentence-transformers`
+ PyTorch dépassaient les 512 Mo du plan gratuit Render (OOM au
démarrage). L'API Jina ramène l'empreinte à ~80 Mo et le build de
15 à 3 minutes.

**pgvector plutôt que ChromaDB.** Le disque Render est éphémère :
les vecteurs disparaissaient à chaque redémarrage pendant que le
compteur Postgres continuait d'afficher les chunks. Une seule base
règle la persistance et rend les `ON DELETE CASCADE` réellement
effectifs.
