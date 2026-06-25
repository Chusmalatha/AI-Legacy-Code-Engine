from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict

from app.services.rag_service import rag_query
from app.state import add_chat_entry, get_chat_history

router = APIRouter()

class QueryRequest(BaseModel):
    project_id: str = Field(..., description="Project identifier")
    question: str = Field(..., description="User question about the codebase")

class SourceInfo(BaseModel):
    file_path: str
    chunk_name: str

class QueryResponse(BaseModel):
    question: str
    answer: str
    sources: List[SourceInfo]
    retrieved_chunks: List[Dict]  # optional, for debugging / UI display

@router.post("/query", response_model=QueryResponse)
async def ask_question(request: QueryRequest):
    try:
        result = rag_query(request.project_id, request.question)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG processing failed: {e}")

    # Save to chat history
    entry = {
        "question": request.question,
        "answer": result["answer"],
        "sources": result["sources"]
    }
    add_chat_entry(request.project_id, entry)

    return QueryResponse(
        question=request.question,
        answer=result["answer"],
        sources=result["sources"],
        retrieved_chunks=result.get("retrieved_chunks", []),
    )

@router.get("/chat-history/{project_id}")
async def get_history(project_id: str):
    return get_chat_history(project_id)
