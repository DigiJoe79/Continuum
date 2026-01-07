# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import sys

# Configure loguru
logger.remove()
logger.add(
    sys.stderr,
    format="<green>{time:HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{module}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="INFO"
)

from init_db import init_database
from routers import (
    projects_router, assets_router, variants_router,
    scenes_router, settings_router, llm_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_database()
    yield
    # Shutdown


app = FastAPI(
    title="Continuum - Consistent Prompt Engine",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router)
app.include_router(assets_router)
app.include_router(variants_router)
app.include_router(scenes_router)
app.include_router(settings_router)
app.include_router(llm_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
