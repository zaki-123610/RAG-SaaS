from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router
from app.auth_routes import router as auth_router
from db.connection import init_db


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
app.include_router(auth_router)


@app.on_event("startup")
async def startup():
    init_db()