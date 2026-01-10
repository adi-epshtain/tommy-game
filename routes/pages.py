from fastapi import APIRouter, Request
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter()

# Path to React build directory
REACT_BUILD_DIR = Path(__file__).parent.parent / "static" / "react"
REACT_INDEX = REACT_BUILD_DIR / "index.html"


@router.get("/", tags=["Pages"])
@router.get("/login", tags=["Pages"])
@router.get("/signup", tags=["Pages"])
@router.get("/game", tags=["Pages"])
@router.get("/player_stats", tags=["Pages"])
@router.get("/top_players", tags=["Pages"])
@router.get("/admin/login", tags=["Pages"])
@router.get("/admin", tags=["Pages"])
def serve_react_app(request: Request):
    """Serve React app for all frontend routes"""
    if REACT_INDEX.exists():
        return FileResponse(REACT_INDEX)
    else:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail="React app not built. Please run 'cd frontend && npm install && npm run build'"
        )
