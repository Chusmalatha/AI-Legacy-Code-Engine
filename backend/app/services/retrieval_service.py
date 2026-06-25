import pathlib
import json
import numpy as np
import faiss
from typing import List, Dict
from ..state import get_project_data, set_project_data

BASE = pathlib.Path(__file__).resolve().parents[2] / "uploads" / "projects"

def _load_index_and_meta(project_id: str):
    # Try memory cache first
    index, meta = get_project_data(project_id)
    if index is not None and meta is not None:
        return index, meta

    proj_path = BASE / project_id / "vector_db"
    index_path = proj_path / "faiss.index"
    meta_path = proj_path / "metadata.json"
    
    if not index_path.is_file() or not meta_path.is_file():
        raise FileNotFoundError(f"FAISS index or metadata missing for project {project_id}")
    
    index = faiss.read_index(str(index_path))
    with open(meta_path, "r", encoding="utf-8") as f:
        meta = json.load(f)
        
    # Store in memory cache
    set_project_data(project_id, index, meta)
    return index, meta

def search(project_id: str, query_vec: List[float], top_k: int = 5) -> List[Dict]:
    """Search the FAISS index for `project_id` using `query_vec`.
    Returns a list of chunk dicts enriched with ``similarity_score``.
    """
    index, meta = _load_index_and_meta(project_id)
    xb = np.array([query_vec]).astype("float32")
    distances, ids = index.search(xb, top_k)
    # Convert L2 distance to similarity‑like score (higher = better)
    sims = 1 / (1 + distances[0])
    results: List[Dict] = []
    for idx, sim in zip(ids[0], sims):
        if idx == -1:
            continue
        chunk = meta[idx].copy()
        chunk["similarity_score"] = round(float(sim), 4)
        results.append(chunk)
    return results
