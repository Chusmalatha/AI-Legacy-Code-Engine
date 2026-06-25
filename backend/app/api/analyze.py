import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path
import json
import uuid
from ..utils.code_extractor import extract_chunks_from_file

router = APIRouter()

UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads" / "projects"

# Helper to ignore directories/files (same as projects API)
IGNORE_DIRS = {
    ".git",
    "node_modules",
    "venv",
    ".venv",
    "dist",
    "build",
    "__pycache__",
    ".vscode",
    ".idea",
    "coverage",
    "target",
    ".cache",
}

IGNORE_FILES = set()  # No file-level ignore needed beyond extensions handled by extractor

def _should_skip(entry: Path) -> bool:
    if entry.is_dir() and entry.name in IGNORE_DIRS:
        return True
    return False

@router.post("/projects/{project_id}/analyze")
async def analyze_project(project_id: str):
    project_path = UPLOAD_ROOT / project_id
    if not project_path.exists() or not project_path.is_dir():
        raise HTTPException(status_code=404, detail="Project not found")

    chunks_dir = project_path / "chunks"
    chunks_dir.mkdir(parents=True, exist_ok=True)
    chunks_file = chunks_dir / "chunks.json"
    all_chunks = []
    files_processed = 0

    for root, dirs, files in os.walk(project_path):
        # prune ignored directories in-place
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for file in files:
            file_path = Path(root) / file
            # skip files inside the chunks folder itself
            if "chunks" in file_path.parts:
                continue
            # process only supported extensions via extractor
            chunks = extract_chunks_from_file(file_path, project_id)
            if chunks:
                all_chunks.extend(chunks)
                files_processed += 1

    # write chunks to JSON file
    with open(chunks_file, "w", encoding="utf-8") as f:
        json.dump(all_chunks, f, ensure_ascii=False, indent=2)

    return JSONResponse(content={
        "project_id": project_id,
        "files_processed": files_processed,
        "chunks_created": len(all_chunks),
        "status": "completed"
    })

@router.get("/projects/{project_id}/chunks")
async def list_chunks(project_id: str):
    chunks_file = UPLOAD_ROOT / project_id / "chunks" / "chunks.json"
    if not chunks_file.exists():
        raise HTTPException(status_code=404, detail="Chunks not generated")
    with open(chunks_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    return JSONResponse(content=data)

@router.get("/projects/{project_id}/chunks/{chunk_id}")
async def get_chunk(project_id: str, chunk_id: str):
    chunks_file = UPLOAD_ROOT / project_id / "chunks" / "chunks.json"
    if not chunks_file.exists():
        raise HTTPException(status_code=404, detail="Chunks not generated")
    with open(chunks_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    for chunk in data:
        if chunk.get("chunk_id") == chunk_id:
            return JSONResponse(content=chunk)
    raise HTTPException(status_code=404, detail="Chunk not found")
