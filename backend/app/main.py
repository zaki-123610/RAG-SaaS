from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router

app = FastAPI(title="RAG SaaS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://rag-saa-s-theta.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)