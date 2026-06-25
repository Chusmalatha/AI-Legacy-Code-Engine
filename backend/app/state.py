import threading
from typing import Dict, List

# Simple thread‑safe in‑memory store
_state_lock = threading.Lock()

# Project info: status, name, file/chunk counts, errors
PROJECTS: Dict[str, Dict] = {}

# Chat history per project
CHAT_HISTORY: Dict[str, List[Dict]] = {}

# FAISS index per project
FAISS_INDEXES: Dict[str, object] = {}

# Metadata list per project
METADATA: Dict[str, List[Dict]] = {}

def set_project_info(project_id: str, info: Dict):
    with _state_lock:
        PROJECTS[project_id] = info

def get_project_info(project_id: str) -> Dict:
    with _state_lock:
        return PROJECTS.get(project_id, {})

def add_chat_entry(project_id: str, entry: Dict):
    with _state_lock:
        CHAT_HISTORY.setdefault(project_id, []).append(entry)

def get_chat_history(project_id: str) -> List[Dict]:
    with _state_lock:
        return CHAT_HISTORY.get(project_id, [])

def set_project_data(project_id: str, index_obj: object, metadata: List[Dict]):
    with _state_lock:
        FAISS_INDEXES[project_id] = index_obj
        METADATA[project_id] = metadata

def get_project_data(project_id: str):
    with _state_lock:
        return FAISS_INDEXES.get(project_id), METADATA.get(project_id)

def initialize_state():
    import json
    from pathlib import Path
    try:
        import faiss
    except ImportError:
        faiss = None
        
    upload_root = Path(__file__).resolve().parents[1] / "uploads" / "projects"
    if not upload_root.exists():
        return

    for project_dir in upload_root.iterdir():
        if not project_dir.is_dir():
            continue
        project_id = project_dir.name
        
        index_path = project_dir / "vector_db" / "faiss.index"
        metadata_path = project_dir / "vector_db" / "metadata.json"
        chunks_path = project_dir / "chunks" / "chunks.json"
        
        # Load from project_info.json if it exists
        info_path = project_dir / "project_info.json"
        disk_info = {}
        if info_path.exists():
            try:
                with open(info_path, "r", encoding="utf-8") as f:
                    disk_info = json.load(f)
            except Exception:
                pass

        status = disk_info.get("status", "error" if not index_path.exists() else "ready")
        error_msg = disk_info.get("error", "Process interrupted on server restart." if status == "error" else None)
        file_count = disk_info.get("file_count", 0)
        chunk_count = disk_info.get("chunk_count", 0)
        project_name = disk_info.get("project_name", project_id)

        if chunk_count == 0 and chunks_path.exists():
            try:
                with open(chunks_path, "r", encoding="utf-8") as f:
                    chunks = json.load(f)
                    chunk_count = len(chunks)
                    file_count = len(set(c.get("file_path") for c in chunks if c.get("file_path")))
            except Exception:
                pass

        loaded_index = None
        loaded_meta = None
        if index_path.exists() and metadata_path.exists():
            if faiss is not None:
                try:
                    loaded_index = faiss.read_index(str(index_path))
                    with open(metadata_path, "r", encoding="utf-8") as mf:
                        loaded_meta = json.load(mf)
                except Exception as e:
                    print(f"Failed to load FAISS index or metadata for {project_id}: {e}")
                    status = "error"
                    error_msg = f"Failed to load FAISS index: {e}"
        
        # If project name is still project_id (no info file), guess it from directories
        if project_name == project_id:
            ignore_guess_dirs = ["chunks", "vector_db", ".git", ".github", ".vscode", "node_modules", "venv", ".venv", "dist", "build", "temp_clone"]
            for entry in project_dir.iterdir():
                if entry.is_dir() and entry.name not in ignore_guess_dirs:
                    project_name = entry.name
                    break
        
        PROJECTS[project_id] = {
            "project_id": project_id,
            "project_name": project_name,
            "status": status,
            "file_count": file_count,
            "chunk_count": chunk_count,
            "error": error_msg,
            "source": disk_info.get("source", "repository")
        }
        
        if loaded_index and loaded_meta:
            FAISS_INDEXES[project_id] = loaded_index
            METADATA[project_id] = loaded_meta

# Perform auto recovery on startup/import
initialize_state()
