# RAG-SaaS

Plateforme SaaS de Retrieval-Augmented Generation.

## Structure

```
RAG-SaaS/
├── backend/
│   ├── venv/         # environnement virtuel Python (ignoré)
│   ├── .env           # variables d'environnement (ignoré)
│   ├── requirements.txt
│   ├── data/           # données brutes / documents à indexer
│   ├── scripts/        # scripts utilitaires (ingestion, indexation, etc.)
│   ├── rag/            # logique RAG (retrieval, embeddings, chaînes)
│   ├── eval/           # évaluation de la pipeline RAG
│   └── app/            # application FastAPI (API)
└── frontend/            # application front-end
```

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
