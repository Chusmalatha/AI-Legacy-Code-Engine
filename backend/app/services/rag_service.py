from typing import List, Dict

from .embedding_service import embed_text
from .retrieval_service import search as retrieve
from .llm_service import call_llm

DEFAULT_TOP_K = 5

def rag_query(project_id: str, question: str, top_k: int = DEFAULT_TOP_K) -> Dict:
    """Full RAG pipeline.
    1️⃣ Embed the user question.
    2️⃣ Retrieve the top‑k most similar chunks.
    3️⃣ Build a prompt and call the LLM.
    Returns a dict with ``answer`` and ``sources`` (list of file_path + chunk name).
    """
    # 1 – embed the question
    query_vec = embed_text(question)

    # 2 – retrieve relevant chunks (include similarity score)
    chunks: List[Dict] = retrieve(project_id, query_vec, top_k=top_k)

    # Filter out irrelevant tail chunks relative to the best match score (using a safe 82% margin)
    if chunks:
        best_score = max(c.get("similarity_score", 0) for c in chunks)
        threshold = best_score * 0.82
        chunks = [c for c in chunks if c.get("similarity_score", 0) >= threshold]

    # 3 – call LLM with context + question
    answer = call_llm(question, chunks)

    # Build source list for the response, citing only files mentioned in the answer
    import re
    sources = []
    answer_lower = answer.lower()
    for c in chunks:
        file_path = c.get("file_path", "")
        # Get filename only (e.g., auth-controller.js)
        filename = file_path.replace("\\", "/").split("/")[-1].lower()
        basename = filename.split(".")[0]
        # Check if filename is mentioned in the text as a whole word
        if filename in answer_lower or (len(basename) > 3 and re.search(rf"\b{re.escape(basename)}\b", answer_lower)):
            sources.append({
                "file_path": c.get("file_path"),
                "chunk_name": c.get("name"),
            })
    return {"answer": answer, "sources": sources, "retrieved_chunks": chunks}
