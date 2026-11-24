from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.auth_routes import router as auth_router
from app.limiter import limiter
from app.middleware import UPLOAD_MAX_BODY, BodySizeLimit, validation_error_handler
from app.public_routes import public_router
from app.routes import router
from db.connection import init_db

app = FastAPI(title="RAG SaaS")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(RequestValidationError, validation_error_handler)

# Ajoute en premier = le plus proche des routes. Ainsi l erreur 413 n est pas
# enveloppee par BaseHTTPMiddleware (PublicCORS), et les reponses 413 passent
# par CORSMiddleware : le navigateur peut lire le message d erreur.
app.add_middleware(BodySizeLimit, per_path={"/upload": UPLOAD_MAX_BODY})

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://rag-saa-s-theta.vercel.app",
    ],
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(router)
app.include_router(auth_router)

public_app = FastAPI()
public_app.state.limiter = limiter
public_app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
public_app.add_exception_handler(RequestValidationError, validation_error_handler)
public_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)
public_app.include_router(public_router)

class PublicCORS(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        if not request.url.path.startswith("/public"):
            return await call_next(request)

        if request.method == "OPTIONS":
            reponse = Response(status_code=200)
        else:
            reponse = await call_next(request)

        reponse.headers["Access-Control-Allow-Origin"] = "*"
        reponse.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
        reponse.headers["Access-Control-Allow-Headers"] = "Content-Type"
        reponse.headers["Access-Control-Max-Age"] = "600"
        return reponse


app.add_middleware(PublicCORS)

app.mount("/public", public_app)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
async def startup():
    init_db()
