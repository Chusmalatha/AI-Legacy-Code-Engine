import uuid
import shutil
import aiofiles
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse

from .pipeline import process_repository
from ..state import set_project_info

router = APIRouter()

UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads" / "projects"
UPLOAD_ROOT.mkdir(parents=True, exist_ok=True)

def _generate_project_id() -> str:
    return str(uuid.uuid4())

@router.post("/upload-repository")
async def upload_repository(
    background_tasks: BackgroundTasks,
    url: str = Form(None),
    file: UploadFile = File(None),
):
    """Accept either a GitHub URL or a ZIP file and start processing.
    Exactly one of `url` or `file` must be provided.
    """
    if (url and file) or (not url and not file):
        raise HTTPException(status_code=400, detail="Provide either 'url' or 'file', not both.")

    project_id = _generate_project_id()
    project_path = UPLOAD_ROOT / project_id
    project_path.mkdir(parents=True)

    zip_file_path = None
    if url:
        if not url.startswith("https://github.com/"):
            raise HTTPException(status_code=400, detail="Invalid GitHub URL")
        project_name = url.rstrip("/").split("/")[-1]
        if project_name.endswith(".git"):
            project_name = project_name[:-4]
    else:
        # ZIP upload - write the uploaded file to disk synchronously/asynchronously during request
        if not file.filename.lower().endswith('.zip'):
            raise HTTPException(status_code=400, detail="File must be a zip archive")
        zip_file_path = project_path / file.filename
        async with aiofiles.open(zip_file_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):
                await out_file.write(chunk)
        project_name = file.filename[:-4]  # default project name from ZIP name

    # Initialise in‑memory state for the project
    info = {
        "project_id": project_id,
        "project_name": project_name,
        "status": "processing",
        "file_count": 0,
        "chunk_count": 0,
        "error": None,
        "source": "github" if url else "zip"
    }
    set_project_info(project_id, info)
    
    # Save project_info.json to disk
    import json
    try:
        with open(project_path / "project_info.json", "w", encoding="utf-8") as f:
            json.dump(info, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

    # Launch background pipeline with clone or ZIP extraction handled there
    background_tasks.add_task(
        process_repository, 
        project_id, 
        url, 
        str(zip_file_path) if zip_file_path else None
    )

    return JSONResponse(content={"project_id": project_id, "project_name": project_name, "status": "processing"})
