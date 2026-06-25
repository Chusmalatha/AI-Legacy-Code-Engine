import os
import json
from pathlib import Path
from typing import List, Dict
from dotenv import load_dotenv

import faiss
import numpy as np

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.services.embedding_service import embed_text
from ..state import set_project_data

load_dotenv()

router = APIRouter()

# Safe multi-parent folder resolution for backend workspace
UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads" / "projects"

def get_chunks(project_id: str) -> List[Dict]:
    chunks_file = UPLOAD_ROOT / project_id / "chunks" / "chunks.json"
    if not chunks_file.exists():
        raise HTTPException(status_code=404, detail="Chunks not generated for project")
    with open(chunks_file, "r", encoding="utf-8") as f:
        return json.load(f)

@router.post("/projects/{project_id}/index")
async def create_faiss_index(project_id: str):
    project_path = UPLOAD_ROOT / project_id
    if not project_path.is_dir():
        raise HTTPException(status_code=404, detail="Project not found")

    chunks = get_chunks(project_id)
    if not chunks:
        raise HTTPException(status_code=400, detail="No chunks to index")

    vectors = []
    metadata = []

    for idx, chunk in enumerate(chunks):
        try:
            embedding = embed_text(chunk["code_content"])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Embedding failed for chunk {chunk.get('chunk_id')}: {str(e)}")
        vectors.append(embedding)
        metadata.append({
            "chunk_id": chunk["chunk_id"],
            "file_path": chunk["file_path"],
            "chunk_type": chunk["chunk_type"],
            "name": chunk["name"],
            "code_content": chunk["code_content"],
            "vector_index": idx,
        })

    # Convert to numpy array safely
    xb = np.array(vectors).astype('float32')
    dimension = xb.shape[1]

    # Build FAISS index (simple L2 index)
    index = faiss.IndexFlatL2(dimension)
    index.add(xb)

    # Persist index and metadata
    vector_dir = project_path / "vector_db"
    vector_dir.mkdir(parents=True, exist_ok=True)
    index_path = vector_dir / "faiss.index"
    faiss.write_index(index, str(index_path))

    metadata_path = vector_dir / "metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as mf:
        json.dump(metadata, mf, ensure_ascii=False, indent=2)

    # Load index and metadata into memory
    loaded_index = faiss.read_index(str(index_path))
    set_project_data(project_id, loaded_index, metadata)

    return JSONResponse(content={
        "project_id": project_id,
        "status": "indexed",
        "chunks_indexed": len(metadata)
    })

@router.get("/projects/{project_id}/index")
async def get_faiss_index(project_id: str):
    return await create_faiss_index(project_id)

@router.get("/projects/{project_id}/index-status")
async def index_status(project_id: str):
    index_path = UPLOAD_ROOT / project_id / "vector_db" / "faiss.index"
    metadata_path = UPLOAD_ROOT / project_id / "vector_db" / "metadata.json"
    if not index_path.exists() or not metadata_path.exists():
        return JSONResponse(content={
            "project_id": project_id,
            "indexed": False,
            "chunks_indexed": 0,
        })
    with open(metadata_path, "r", encoding="utf-8") as mf:
        meta = json.load(mf)
    return JSONResponse(content={
        "project_id": project_id,
        "indexed": True,
        "chunks_indexed": len(meta),
    })
