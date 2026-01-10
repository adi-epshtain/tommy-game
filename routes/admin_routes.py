from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from auth_utils import get_current_admin, create_access_token, ADMIN_USERNAME, ADMIN_PASSWORD
from infra.database import get_db
from models import Player
from dal.player_session_dal import get_last_player_sessions
from dal.player_answer_dal import get_wrong_questions

router = APIRouter()


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class PlayerListItem(BaseModel):
    id: int
    name: str
    age: Optional[int]
    created_at: str


class PlayersListResponse(BaseModel):
    players: List[PlayerListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


@router.post("/admin/login", tags=["Admin"])
async def admin_login(req: AdminLoginRequest):
    # Strip whitespace and compare strings
    username = req.username.strip() if req.username else ""
    password = req.password.strip() if req.password else ""
    
    expected_username = ADMIN_USERNAME.strip() if ADMIN_USERNAME else ""
    expected_password = ADMIN_PASSWORD.strip() if ADMIN_PASSWORD else ""
    
    if username != expected_username or password != expected_password:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    access_token = await create_access_token({
        "sub": username,
        "role": "admin"
    })
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/admin/players", tags=["Admin"])
async def get_players(
    page: int = 1,
    page_size: int = 10,
    search: Optional[str] = None,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get list of players with pagination and search by name.
    """
    query = db.query(Player)
    
    # Search by name if provided
    if search:
        query = query.filter(Player.name.ilike(f"%{search}%"))
    
    # Get total count
    total = query.count()
    
    # Pagination
    offset = (page - 1) * page_size
    players = query.order_by(Player.created_at.desc()).offset(offset).limit(page_size).all()
    
    total_pages = (total + page_size - 1) // page_size
    
    return PlayersListResponse(
        players=[
            PlayerListItem(
                id=p.id,
                name=p.name,
                age=p.age,
                created_at=p.created_at.isoformat() if p.created_at else ""
            )
            for p in players
        ],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/admin/players/{player_id}/stats", tags=["Admin"])
async def get_player_stats_admin(
    player_id: int,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get player statistics (same as what player sees).
    """
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    player_sessions = await get_last_player_sessions(db, player.id)
    player_stats_list = [
        await get_wrong_questions(player_session) 
        for player_session in player_sessions
    ]
    
    return {
        "player_name": player.name,
        "player_id": player.id,
        "player_stats": [
            {
                "started_at": ps.started_at,  # Already ISO format string from get_wrong_questions
                "correct_count": ps.correct_count,
                "incorrect_count": ps.incorrect_count,
                "wrong_answer": ps.wrong_answer
            }
            for ps in player_stats_list
        ]
    }

