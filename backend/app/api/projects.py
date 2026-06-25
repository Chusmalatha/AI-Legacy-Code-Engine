from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pathlib import Path

router = APIRouter()

UPLOAD_ROOT = Path(__file__).resolve().parents[2] / "uploads" / "projects"

# Directories and files to ignore when building the repository tree
IGNORE_DIRS = {
    ".git",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".tox",
    ".venv",
    "venv",
    "env",
    "node_modules",
    ".next",
    ".nuxt",
    ".npm",
    ".yarn",
    ".pnpm-store",
    "build",
    "dist",
    "out",
    "target",
    "coverage",
    "htmlcov",
    ".idea",
    ".vscode",
    ".cache",
    "logs",
    ".terraform",
    ".gradle",
    ".history",
    ".sass-cache",
    ".parcel-cache",
    "temp_clone",
}

IGNORE_FILES = {
    ".gitignore",
    ".gitattributes",
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".python-version",
    ".DS_Store",
    "Thumbs.db",
    "desktop.ini",
    "npm-debug.log",
    "yarn-error.log",
    "pnpm-debug.log",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "poetry.lock",
    "Pipfile.lock",
    ".coverage",
    ".vscodeignore",
}

def _build_tree(path: Path):
    tree = {}
    for entry in sorted(path.iterdir(), key=lambda e: e.name.lower()):
        if entry.name in IGNORE_DIRS and entry.is_dir():
            continue
        if entry.name in IGNORE_FILES and entry.is_file():
            continue
        if entry.is_dir():
            tree[entry.name] = _build_tree(entry)
        else:
            tree[entry.name] = {}
    return tree

@router.get("/projects")
async def list_projects():
    from ..state import PROJECTS
    return JSONResponse(content=list(PROJECTS.values()))

@router.get("/projects/{project_id}/structure")
async def get_structure(project_id: str):
    project_path = UPLOAD_ROOT / project_id
    if not project_path.exists() or not project_path.is_dir():
        raise HTTPException(status_code=404, detail="Project not found")
    project_name = project_path.name
    structure = _build_tree(project_path)
    return JSONResponse(content={"project_name": project_name, "structure": structure})

@router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    import shutil
    import os
    import stat
    from ..state import PROJECTS, FAISS_INDEXES, METADATA
    
    # Remove from state
    PROJECTS.pop(project_id, None)
    FAISS_INDEXES.pop(project_id, None)
    METADATA.pop(project_id, None)
    
    # Delete from disk
    project_path = UPLOAD_ROOT / project_id
    if project_path.exists() and project_path.is_dir():
        def remove_readonly(func, path, excinfo):
            try:
                os.chmod(path, stat.S_IWRITE)
                func(path)
            except Exception:
                pass

        try:
            shutil.rmtree(str(project_path), onerror=remove_readonly)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete directory: {e}")
            
    return JSONResponse(content={"project_id": project_id, "status": "deleted"})

