from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from ..state import get_project_info

router = APIRouter()

@router.get("/project-status/{project_id}")
async def project_status(project_id: str):
    info = get_project_info(project_id)
    if not info:
        raise HTTPException(status_code=404, detail="Project not found")
    return JSONResponse(content=info)
