from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from starlette.responses import JSONResponse
from sqlalchemy.orm import Session
from enum import Enum
from pydantic import BaseModel
from app import templates
from auth_utils import get_current_player
from dal.game_dal import get_game_by_name, create_game
from dal.player_answer_dal import get_wrong_questions, update_player_answer
from dal.player_dal import get_player_by_name
from dal.player_session_dal import (
    create_player_session, update_score_and_stage_player_session, end_session,
    get_session_by_player_id, get_top_players, PlayerScore
)
from dal.question_dal import get_random_question_by_game, get_question_by_id
from database import get_db
from models import PlayerSession, Question, Player, Game
from scripts.init_math_game import insert_math_stock_questions

router = APIRouter()
MATH_QUESTIONS_FILE = r".\resources\math_stock_questions.jsonl"


class GameInfo(Enum):
    MATH_GAME = ("Math Game",
                 "Solve math problems and race for the highest score")

    @property
    def name(self):
        return self.value[0]

    @property
    def description(self):
        return self.value[1]


@router.get("/game", response_class=HTMLResponse)
async def game_page(request: Request):
    return templates.TemplateResponse(
        "index.html",
        {"request": request}
    )


@router.post("/start", tags=["Game"])
async def start_game(
    current_player=Depends(get_current_player),
    db: Session = Depends(get_db)
):
    player_name: str = current_player.get("sub")
    player: Player = await get_player_by_name(db, player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    game: Game = await get_game_by_name(db, GameInfo.MATH_GAME.name)
    if not game:
        game = await create_game(db, name=GameInfo.MATH_GAME.name, description=GameInfo.MATH_GAME.description)
    player_session: PlayerSession = await create_player_session(db, player_id=player.id, game_id=game.id)
    question: Question = await get_random_question_by_game(db, game.id, player_session.id)
    if not question:
        try:
            await insert_math_stock_questions(db, filename=MATH_QUESTIONS_FILE, game_name=GameInfo.MATH_GAME.name)
        except Exception as e:
            print(f"Insert math stock questions failed with error: {e}")
        question: Question = await get_random_question_by_game(db, game.id, player_session.id)
    return {
        "session_id": player_session.id,
        "question": question.text,
        "question_id": question.id
    }


class AnswerRequest(BaseModel):
    answer: int
    question_id: int
    game_name: str


@router.post("/answer", tags=["Game"])
async def submit_answer(
    req: AnswerRequest,
    current_player=Depends(get_current_player),
    db: Session = Depends(get_db)
):
    player_name = current_player.get("sub")
    player: Player = await get_player_by_name(db, player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    question: Question = await get_question_by_id(db, req.question_id)
    if not question:
        raise HTTPException(status_code=404, detail=f"Question not found question id: {req.question_id}")
    player_session: Optional[PlayerSession] = await get_session_by_player_id(db, player.id)
    if not player_session:
        raise HTTPException(status_code=404, detail=f"No active session found for player: {player.name}")
    is_correct: bool = await update_score_and_stage_player_session(db, question, player_session, req.answer)
    await update_player_answer(db, player_session.id, question.id, req.answer, is_correct)
    game: Game = await get_game_by_name(db, req.game_name)
    if player_session.score >= game.winning_score:
        await end_session(db, player_session.id)
        return JSONResponse({"redirect": "/end"})
    new_question: Question = await get_random_question_by_game(db, game.id, player_session.id)
    return JSONResponse({
        "is_correct": is_correct,
        "score": player_session.score,
        "question": new_question.text,
        "question_id": new_question.id,
        "stage": player_session.stage,
        "wrong_questions": await get_wrong_questions(player_session)
    })


@router.get("/end", response_class=HTMLResponse)
async def end_game(
    request: Request,
    current_player=Depends(get_current_player),
    db: Session = Depends(get_db)
):
    player_name = current_player.get("sub")
    player: Player = await get_player_by_name(db, player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    player_session: Optional[PlayerSession] = await get_session_by_player_id(db, player.id)
    if not player_session:
        raise HTTPException(status_code=404, detail="No active session found for player")
    top_players: List[PlayerScore] = await get_top_players(db, limit=5)
    return templates.TemplateResponse("end.html", {
        "request": request,
        "score": player_session.score,
        "player_name": player_name,
        "top_players": top_players
    })


@router.get("/api/game_end", tags=["Game"])
async def game_end_data(
    current_player=Depends(get_current_player),
    db: Session = Depends(get_db)
):
    player_name = current_player.get("sub")
    player: Player = await get_player_by_name(db, player_name)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    player_session: Optional[PlayerSession] = await get_session_by_player_id(db, player.id)
    if not player_session:
        raise HTTPException(status_code=404, detail="No active session found for player")
    top_players: List[PlayerScore] = await get_top_players(db, limit=5)
    return {
        "score": player_session.score,
        "player_name": player_name,
        "top_players": [{"name": p.name, "score": p.score} for p in top_players]
    }
