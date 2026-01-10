from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from auth_utils import get_current_admin, create_access_token, ADMIN_USERNAME, ADMIN_PASSWORD
from infra.database import get_db
from models import Player
from dal.player_session_dal import get_last_player_sessions
from dal.player_answer_dal import get_wrong_questions
from dal.player_trends_dal import get_player_trends_by_period, compare_player_periods
from dal.player_dal import delete_player as delete_player_dal

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


@router.get("/admin/players/{player_id}/trends", tags=["Admin"])
async def get_player_trends(
    player_id: int,
    period: str = Query("week", regex="^(week|month)$"),
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Get player trends grouped by period (week or month).
    Returns statistics for each period showing player performance over time.
    """
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    trends = await get_player_trends_by_period(db, player_id, period)

    return {
        "player_name": player.name,
        "player_id": player.id,
        "period_type": period,
        "trends": [
            {
                "period_label": t.period_label,
                "start_date": t.start_date.isoformat() if t.start_date else None,
                "end_date": t.end_date.isoformat() if t.end_date else None,
                "total_games": t.total_games,
                "avg_score": t.avg_score,
                "success_rate": t.success_rate,
                "total_correct": t.total_correct,
                "total_incorrect": t.total_incorrect
            }
            for t in trends
        ]
    }


@router.get("/admin/players/{player_id}/compare", tags=["Admin"])
async def compare_player_periods_api(
    player_id: int,
    period1_start: str = Query(..., description="ISO format datetime for period 1 start"),
    period1_end: str = Query(..., description="ISO format datetime for period 1 end"),
    period2_start: str = Query(..., description="ISO format datetime for period 2 start"),
    period2_end: str = Query(..., description="ISO format datetime for period 2 end"),
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Compare player performance between two time periods.
    """
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    try:
        p1_start = datetime.fromisoformat(period1_start.replace('Z', '+00:00'))
        p1_end = datetime.fromisoformat(period1_end.replace('Z', '+00:00'))
        p2_start = datetime.fromisoformat(period2_start.replace('Z', '+00:00'))
        p2_end = datetime.fromisoformat(period2_end.replace('Z', '+00:00'))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")

    comparison = await compare_player_periods(
        db, player_id, p1_start, p1_end, p2_start, p2_end
    )

    return {
        "player_name": player.name,
        "player_id": player.id,
        **comparison
    }


@router.delete("/admin/players/{player_id}", tags=["Admin"])
async def delete_player_admin(
    player_id: int,
    admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a player and all related data (sessions, answers).
    """
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    deleted_player = await delete_player_dal(db, player_id)
    
    if not deleted_player:
        raise HTTPException(status_code=500, detail="Failed to delete player")

    return {
        "message": f"Player {deleted_player.name} (ID: {player_id}) deleted successfully",
        "deleted_player_id": player_id
    }

