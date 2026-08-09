from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()


class GenerateRequest(BaseModel):
    code: str
    language: str = "javascript"


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/generate")
async def generate(body: GenerateRequest):
    return {"received": len(body.code), "language": body.language}