from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional

from app.services.embedding_service import embed_text
from app.services.retrieval_service import search as retrieve

router = APIRouter()

class SearchRequest(BaseModel):
    project_id: str = Field(..., description="Project identifier")
    query: str = Field(..., description="Natural language search query")
    top_k: Optional[int] = Field(5, gt=0, description="Number of results to return")

class ChunkResult(BaseModel):
    chunk_id: str
    file_path: str
    chunk_type: str
    name: str
    similarity_score: float
    code_content: str

class SearchResponse(BaseModel):
    query: str
    results: List[ChunkResult]

@router.post("/search", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    # 1️⃣ Embed the query
    try:
        query_vec = embed_text(request.query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {e}")

    # 2️⃣ Retrieve matching chunks
    try:
        raw_results = retrieve(request.project_id, query_vec, top_k=request.top_k)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {e}")

    # 3️⃣ Build response objects – ensure every field exists
    results: List[ChunkResult] = []
    for r in raw_results:
        # If the metadata does not include the actual source code, add an empty placeholder.
        if "code_content" not in r:
            r["code_content"] = ""
        results.append(ChunkResult(**r))

    return SearchResponse(query=request.query, results=results)
