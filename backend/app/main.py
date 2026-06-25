# Trigger auto-reload to update HuggingFace token and project states from .env
from app.api import health, upload, projects, analyze, indexing, search, query, status
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="AI Legacy Code Knowledge Engine Backend", version="0.1.0")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://ai-legacy-code-engine.vercel.app",
    "https://ai-legacy-code-engine.vercel.app/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(analyze.router, prefix="/api")
app.include_router(indexing.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(query.router, prefix="/api")
app.include_router(status.router, prefix="/api")