import shutil
import logging
import json
from pathlib import Path
from git import Repo

from app.api.analyze import analyze_project
from app.api.indexing import create_faiss_index
from ..state import set_project_info, get_project_info

async def process_repository(project_id: str, url: str = None, zip_path: str = None):
    """Run the full repo processing pipeline in background.
    Steps: clone/extract -> analyze -> create FAISS index.
    Updates in‑memory project info with progress states and errors.
    """
    project_path = Path(__file__).resolve().parents[2] / "uploads" / "projects" / project_id
    
    try:
        # 1. Clone or unpack
        if url:
            info = get_project_info(project_id) or {}
            info.update({"status": "cloning"})
            set_project_info(project_id, info)
            
            Repo.clone_from(url, str(project_path))
        elif zip_path:
            info = get_project_info(project_id) or {}
            info.update({"status": "extracting"})
            set_project_info(project_id, info)
            
            shutil.unpack_archive(zip_path, str(project_path))
            Path(zip_path).unlink()
            
            # Detect nested folder and set name if appropriate
            entries = [p for p in project_path.iterdir() if p.is_dir() and p.name not in ["chunks", "vector_db", ".git"]]
            if entries:
                info["project_name"] = entries[0].name
                set_project_info(project_id, info)

        # 2. Run analysis (chunking)
        info = get_project_info(project_id) or {}
        info.update({"status": "chunking"})
        set_project_info(project_id, info)

        analysis_response = await analyze_project(project_id)
        try:
            analysis_data = json.loads(analysis_response.body.decode())
        except Exception:
            analysis_data = {}

        # 3. Run indexing
        info = get_project_info(project_id) or {}
        info.update({"status": "indexing"})
        set_project_info(project_id, info)

        await create_faiss_index(project_id)

        # 4. Complete
        info = get_project_info(project_id) or {}
        info.update({
            "status": "ready",
            "file_count": analysis_data.get('files_processed', 0),
            "chunk_count": analysis_data.get('chunks_created', 0),
            "error": None
        })
        set_project_info(project_id, info)

    except Exception as e:
        logging.error(f"Error processing repository {project_id}: {e}", exc_info=True)
        info = get_project_info(project_id) or {}
        info.update({
            "status": "error",
            "error": str(e)
        })
        set_project_info(project_id, info)
